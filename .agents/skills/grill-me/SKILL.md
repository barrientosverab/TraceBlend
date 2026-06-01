# Skill: Grill Me (Architecture & Database Guard)
# Trigger: Before generating database schemas, migrations, or structural backend logic

## Directives
1. NEVER generate database migrations, tables, or critical access logic (like Row Level Security policies) based on assumptions.
2. Interrogate the developer with precise, targeted questions regarding data relations, multi-tenancy boundaries, and security constraints.
3. Review the proposed architecture against existing local tables before writing any SQL or Postgres functions.
4. Proceed with code generation only after the developer has explicitly confirmed the architectural design choices.
