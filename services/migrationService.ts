// @ts-nocheck
import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';

interface MigrationStatus {
  id: string;
  name: string;
  version: string;
  applied_at: string;
  checksum: string;
  success: boolean;
  error_message?: string;
}

interface Migration {
  id: string;
  name: string;
  version: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  checksum: string;
}

class MigrationService {
  private client = getSupabaseClient();

  private migrations: Migration[] = [];

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    // Sort by version to ensure proper order
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Check if migrations table exists and create if needed
   */
  private async ensureMigrationsTable(): Promise<void> {
    const { error } = await this.client
      .from('migrations')
      .select('id')
      .limit(1);

    // If table doesn't exist, create it
    if (error?.code === 'PGRST116') {
      const { error: createError } = await this.client.rpc('create_migrations_table');
      if (createError) {
        throw new Error(`Failed to create migrations table: ${createError.message}`);
      }
    } else if (error) {
      throw new Error(`Error checking migrations table: ${error.message}`);
    }
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<MigrationStatus[]> {
    await this.ensureMigrationsTable();
    
    const { data, error } = await this.client
      .from('migrations')
      .select('*')
      .order('version', { ascending: true });

    if (error) {
      throw new Error(`Failed to get applied migrations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration, success: boolean, errorMessage?: string): Promise<void> {
    const { error } = await this.client
      .from('migrations')
      .insert({
        id: migration.id,
        name: migration.name,
        version: migration.version,
        applied_at: new Date().toISOString(),
        checksum: migration.checksum,
        success,
        error_message: errorMessage
      });

    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
  }

  /**
   * Remove migration record (for rollback)
   */
  private async removeMigrationRecord(migrationId: string): Promise<void> {
    const { error } = await this.client
      .from('migrations')
      .delete()
      .eq('id', migrationId);

    if (error) {
      throw new Error(`Failed to remove migration record: ${error.message}`);
    }
  }

  /**
   * Run pending migrations
   */
  async migrate(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Cannot run migrations.');
    }

    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    const pendingMigrations = this.migrations.filter(m => !appliedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      console.warn('No pending migrations');
      return;
    }

    console.warn(`Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      try {
        console.warn(`Applying migration: ${migration.name} (${migration.version})`);
        await migration.up();
        await this.recordMigration(migration, true);
        console.warn(`✓ Migration ${migration.name} applied successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ Migration ${migration.name} failed: ${errorMessage}`);
        await this.recordMigration(migration, false, errorMessage);
        throw new Error(`Migration ${migration.name} failed: ${errorMessage}`);
      }
    }

    console.warn('All migrations completed successfully');
  }

  /**
   * Rollback migrations
   */
  async rollback(targetVersion?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Cannot rollback migrations.');
    }

    const appliedMigrations = await this.getAppliedMigrations();
    const successfulMigrations = appliedMigrations.filter(m => m.success);

    if (successfulMigrations.length === 0) {
      console.warn('No migrations to rollback');
      return;
    }

    // Sort in reverse order for rollback
    successfulMigrations.sort((a, b) => b.version.localeCompare(a.version));

    const migrationsToRollback = targetVersion
      ? successfulMigrations.filter(m => m.version > targetVersion)
      : [successfulMigrations[0]]; // Rollback only the latest if no target specified

    if (migrationsToRollback.length === 0) {
      console.warn('No migrations to rollback to target version');
      return;
    }

    console.warn(`Rolling back ${migrationsToRollback.length} migrations...`);

    for (const appliedMigration of migrationsToRollback) {
      const migration = this.migrations.find(m => m.id === appliedMigration.id);
      
      if (!migration) {
        console.warn(`Migration ${appliedMigration.name} not found in registered migrations, skipping...`);
        continue;
      }

      try {
        console.warn(`Rolling back migration: ${migration.name} (${migration.version})`);
        await migration.down();
        await this.removeMigrationRecord(migration.id);
        console.warn(`✓ Migration ${migration.name} rolled back successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ Rollback of ${migration.name} failed: ${errorMessage}`);
        throw new Error(`Rollback of ${migration.name} failed: ${errorMessage}`);
      }
    }

    console.warn('Rollback completed successfully');
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    applied: MigrationStatus[];
    pending: Migration[];
    total: number;
  }> {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    const pendingMigrations = this.migrations.filter(m => !appliedVersions.has(m.version));

    return {
      applied: appliedMigrations,
      pending: pendingMigrations,
      total: this.migrations.length
    };
  }

  /**
   * Validate migration checksums
   */
  async validateMigrations(): Promise<{ valid: boolean; errors: string[] }> {
    const appliedMigrations = await this.getAppliedMigrations();
    const errors: string[] = [];

    for (const appliedMigration of appliedMigrations) {
      const migration = this.migrations.find(m => m.id === appliedMigration.id);
      
      if (!migration) {
        errors.push(`Applied migration ${appliedMigration.name} not found in code`);
        continue;
      }

      if (migration.checksum !== appliedMigration.checksum) {
        errors.push(`Checksum mismatch for migration ${migration.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new migration template
   */
  createMigrationTemplate(name: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const version = timestamp.split('T')[0].replace(/-/g, '') + '_' + timestamp.split('T')[1].split('-')[0].replace(/-/g, '');
    const id = `${version}_${name.toLowerCase().replace(/\s+/g, '_')}`;

    return `// @ts-nocheck
import type { Database } from '../utils/database.types';

export const migration_${version}: Migration = {
  id: '${id}',
  name: '${name}',
  version: '${version}',
  checksum: 'UPDATE_WITH_ACTUAL_CHECKSUM',
  
  async up() {
    // Implementation for applying the migration
    console.warn('Applying migration: ${name}');
    
    // Example: Add your migration logic here
    // await getSupabaseClient().rpc('your_migration_function');
  },
  
  async down() {
    // Implementation for rolling back the migration
    console.warn('Rolling back migration: ${name}');
    
    // Example: Add your rollback logic here
    // await getSupabaseClient().rpc('your_rollback_function');
  }
};`;
  }
}

// Export singleton instance
export const migrationService = new MigrationService();

// Helper function to generate checksum for migration content
export function generateMigrationChecksum(content: string): string {
  // Simple hash function - in production, use a proper hash library
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Export types for use in migration files
export type { Migration, MigrationStatus };
export { MigrationService };
