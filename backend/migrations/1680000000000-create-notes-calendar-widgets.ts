import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class CreateNotesCalendarWidgets1680000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'ownerId', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'content', type: 'text' },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createIndex('notes', new TableIndex({ name: 'idx_notes_owner', columnNames: ['ownerId'] }));

    await queryRunner.createTable(
      new Table({
        name: 'calendar_events',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'ownerId', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'startAt', type: 'timestamptz' },
          { name: 'endAt', type: 'timestamptz' },
          { name: 'allDay', type: 'boolean', default: false },
          { name: 'recurrence', type: 'json', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createIndex('calendar_events', new TableIndex({ name: 'idx_calendar_owner', columnNames: ['ownerId'] }));
    await queryRunner.createIndex('calendar_events', new TableIndex({ name: 'idx_calendar_start_at', columnNames: ['startAt'] }));

    await queryRunner.createTable(
      new Table({
        name: 'widget_placements',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'ownerId', type: 'uuid', isNullable: false },
          { name: 'widgetKey', type: 'varchar', length: '255' },
          { name: 'x', type: 'integer' },
          { name: 'y', type: 'integer' },
          { name: 'width', type: 'integer' },
          { name: 'height', type: 'integer' },
          { name: 'zIndex', type: 'integer', default: 0 },
          { name: 'config', type: 'json', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createIndex('widget_placements', new TableIndex({ name: 'idx_widgets_owner', columnNames: ['ownerId'] }));
    await queryRunner.createUniqueConstraint('widget_placements', new TableUnique({ name: 'uq_owner_widgetkey', columnNames: ['ownerId', 'widgetKey'] }));

    // Foreign keys to users table (assumes users table name is 'user' or 'users' depending on project)
    try {
      await queryRunner.query("ALTER TABLE \"notes\" ADD CONSTRAINT \"FK_notes_owner\" FOREIGN KEY (\"ownerId\") REFERENCES \"user\" (id) ON DELETE CASCADE");
      await queryRunner.query("ALTER TABLE \"calendar_events\" ADD CONSTRAINT \"FK_calendar_owner\" FOREIGN KEY (\"ownerId\") REFERENCES \"user\" (id) ON DELETE CASCADE");
      await queryRunner.query("ALTER TABLE \"widget_placements\" ADD CONSTRAINT \"FK_widgets_owner\" FOREIGN KEY (\"ownerId\") REFERENCES \"user\" (id) ON DELETE CASCADE");
    } catch (e) {
      // If users table name differs, migrations should be adjusted. Fail loudly so the migration can be updated.
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('widget_placements');
    await queryRunner.dropTable('calendar_events');
    await queryRunner.dropTable('notes');
  }
}
