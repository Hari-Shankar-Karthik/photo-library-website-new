DONE GET /login -> Render the login page
DONE POST /login -> Login the user
DONE GET /register -> Render the register page
DONE POST /register -> Create a new user
GET /users/:userID -> Render the particular user's photos
POST /users/:userID -> Add a photo to this user
DELETE /users/:userID/photos/:photoID -> Delete the photo
DELETE /users/:userID -> Delete the user and all their photos

flask run --host=0.0.0.0 --port=5000

Doesn't work when the user spams hot trash into the seach bar
