Add a new Mongoose model to the backend.

Arguments: $ARGUMENTS (model name and description)

Steps:
1. Read SPEC.md §4 to understand existing data models and relationships
2. Read existing models in backend/src/models/ to understand patterns
3. Design the Mongoose schema following project conventions:
   - Always include { timestamps: true }
   - Use ObjectId refs for relationships
   - Set select: false on sensitive fields
   - Add toJSON transform to strip sensitive fields
   - Add indexes for fields used in queries
   - Use enums for fixed-value fields
4. Create the model file in backend/src/models/
5. If CRUD operations are needed, create:
   - backend/src/controllers/<name>Controller.js
   - backend/src/routes/<name>Routes.js
6. Register routes in backend/src/app.js
7. Add relevant Socket.IO events if the model has real-time updates

Follow the response envelope: { success: true/false, data/error }
Follow membership authorization patterns from existing controllers.
