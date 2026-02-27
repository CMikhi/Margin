Implement OpenAPI (Swagger) for the backend (NestJS) and add Swagger tags + detailed documentation

Goal
Add OpenAPI/Swagger to the backend so the API is discoverable and well-documented. Annotate controllers and DTOs with Swagger decorators and add detailed operation summaries, responses, and examples. Keep changes focused, follow the repo coding/style rules, and ensure tests/build pass.

Scope (explicit)

- Add Swagger bootstrap in `src/main.ts` to expose UI at `/api` (or `/api/docs`) with persistent authorization.
- Add `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiBearerAuth` to existing controllers in `src/modules/*` (at minimum: `auth`, `users`, `notes`, `calendar`, `widgets`, `roles`).
- Annotate DTOs in `src/modules/**/dto/*.ts` with `@ApiProperty` including `description`, `example`, and `required` where appropriate.
- Add/extend detailed descriptions for endpoints (intent, edge cases, security notes).
- Update backend `CLAUDE.md` to mention the Swagger UI path and any setup steps.
- Add minimal verification: run `npm run build` and `npm test` and fix annotation issues that break build/tests.

Constraints & conventions

- Follow project conventions: immutability, small focused files, DTO validation via class-validator is preserved.
- Keep diffs minimal and surgical — change only files needed.
- Use conventional commit messages: `feat(docs): add OpenAPI/Swagger and annotate controllers`.
- Do not add secrets or expose any private keys.
- Prefer `@nestjs/swagger` usage and standard Nest decorators.
- Add TypeScript types to ApiResponse `type` when feasible (use DTO classes).

Required dependencies (install if missing)

```bash
npm install --save @nestjs/swagger swagger-ui-express
```

Example Swagger bootstrap (to be added to `src/main.ts`)

```ts
const config = new DocumentBuilder()
  .setTitle('Margin API')
  .setDescription('Margin backend API — auth, users, notes, calendar, widgets')
  .setVersion('1.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
  .build();

const document = SwaggerModule.createDocument(app, config, {
  // include additional models if needed
});
SwaggerModule.setup('api', app, document, {
  swaggerOptions: { persistAuthorization: true },
});
```

Controller annotation examples

- Add `@ApiTags('Auth')` at class level.
- For protected controllers or endpoints add `@ApiBearerAuth('access-token')` above controller class or method.
- Example on a route:

```ts
@ApiOperation({ summary: 'Log in user', description: 'Validates credentials and returns access + refresh tokens. Access token TTL ~15m.' })
@ApiResponse({ status: 201, description: 'Login successful', type: LoginResponseDto })
@ApiResponse({ status: 401, description: 'Invalid credentials' })
```

DTO annotation examples

- In DTO classes add:

```ts
@ApiProperty({ description: 'User email address', example: 'alice@example.com' })
email: string;
```

- For response DTOs provide shape and examples.

ApiResponse notes

- Use `type` with DTO classes whenever available.
- For list endpoints use `{ type: SomeDto, isArray: true }`.

File list to update (minimum)

- src/main.ts (Swagger bootstrap)
- src/modules/auth/auth.controller.ts (tags, op descriptions)
- src/modules/users/users.controller.ts
- src/modules/notes/notes.controller.ts
- src/modules/calendar/calendar.controller.ts
- src/modules/widgets/widgets.controller.ts
- src/modules/roles/roles.controller.ts
- src/modules/**/dto/*.ts (annotate DTO properties)
- backend/CLAUDE.md (update with Swagger path and quick start)
If any other controllers exist, annotate them similarly.

Acceptance criteria

- Swagger UI is accessible at `/api` (or `/api/docs`) locally after `npm run start:dev`.
- Major controllers are tagged and each endpoint has at least summary and one `@ApiResponse`.
- DTOs include `@ApiProperty` with examples for all public API inputs/outputs.
- `npm run build` succeeds and unit tests still pass (`npm test`).
- Changes committed on a feature branch with a conventional commit message.

Testing & verification steps (to run locally)

```bash
npm install # if you added deps
npm run build
npm run start:dev
# open http://localhost:5200/api (or configured port)
npm test
```

Developer notes/edge-cases

- Use `extraModels` in `createDocument` if automatic discovery misses DTOs referenced only in `@ApiResponse`.
- Keep controller method bodies unchanged; focus on decorators and DTO annotations.
- If an endpoint uses union or paginated wrappers create small wrapper DTOs annotated and include them in the document.
- If adding imports to many files, keep style consistent with existing code (ES module imports, ordered imports).

Commit and PR

- Create branch `feat/docs/swagger`.
- Commit message: `feat(docs): add OpenAPI/Swagger and annotate controllers and DTOs`
- Include in PR description: list changed files, verification steps, note that no behavior was changed (only docs).

If you run into broken tests caused by decorator usage or missing `class-transformer` metadata, fix by adding required `reflect-metadata` import or adjust tsconfig for emitDecoratorMetadata, and document changes in the PR.

Deliverables

- All code changes to backend files described above.
- Updated `backend/CLAUDE.md` describing Swagger UI path and local setup steps.
- A short summary in the PR description describing what was annotated and why.

End of prompt.

Would you like me to:

- run the installs and make the initial `src/main.ts` change now, or
- just save this prompt for you to paste into Claude Code?
