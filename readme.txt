config-proxy/
├── controllers/
│   └── ConfigIntPlayerController.js
├── models/
│   └── ConfigIntPlayer.js
├── routes/
│   └── ConfigIntPlayerRoutes.js
├── services/
│   └── ConfigIntPlayerService.js
├── utils/
│   └── db.js
├── .env
├── package.json
├── server.js

This structure organizes your project into clear, maintainable components. Controllers handle HTTP requests, 
services contain business logic, models define the database schema, and routes define API endpoints. 

controllers/: Contains controllers that handle incoming requests and interact with services.

configController.js: Manages request handling for configuration data.
models/: Contains Mongoose models.

Config.js: Defines the schema for the configuration data.
routes/: Contains route definitions.

configRoutes.js: Defines API routes for the configuration data.
services/: Contains business logic and interacts with the database.

configService.js: Handles the logic for saving and retrieving configuration data.
utils/: Contains utility functions.

db.js: Manages the database connection.
.env: Environment variables for sensitive data like database URI.

package.json: Project dependencies and scripts.

server.js: Main entry point for the Express server.

