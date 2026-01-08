# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, Socket.io, and MySQL. Features include private messaging, group chat rooms, typing indicators, online status, and file sharing.

## Features

- User authentication (register/login) with JWT
- Real-time messaging using Socket.io
- Private one-on-one messaging
- Group chat rooms
- Create and join chat rooms
- Online/offline user status
- Typing indicators
- File and image sharing
- Message history persistence
- Responsive design for mobile and desktop

## Technology Stack

### Frontend
- React 18
- Socket.io Client
- Axios for API requests
- React Router for navigation
- CSS3 for styling

### Backend
- Node.js & Express
- Socket.io for real-time communication
- MySQL database
- JWT authentication
- Bcrypt for password hashing
- Cloudinary for file uploads
- Multer for handling multipart/form-data

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Cloudinary account (for file uploads) - [Sign up here](https://cloudinary.com/)

## Local Setup Instructions

### 1. Clone or Download the Project

```bash
cd chat-app
```

### 2. Database Setup

1. Start your MySQL server
2. Create a new database:

```sql
CREATE DATABASE chat_app;
```

3. Import the schema:

```bash
mysql -u your_username -p chat_app < database/schema.sql
```

Or manually run the SQL commands from `database/schema.sql` in your MySQL client.

### 3. Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

4. Edit `.env` and configure your environment variables:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=chat_app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

5. Start the backend server:

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The server will start on [http://localhost:5000](http://localhost:5000)

### 4. Frontend Setup

1. Open a new terminal and navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
cp .env.example .env
```

4. Edit `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

5. Start the React development server:

```bash
npm start
```

The application will open in your browser at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Join Rooms**: Select from existing rooms or create a new one
4. **Chat**: Send messages in group rooms or private messages to users
5. **Upload Files**: Click the attachment icon to share images or files
6. **See Status**: View online/offline status of other users

## Deployment

### Deploy Backend to Railway

1. Create a [Railway](https://railway.app/) account
2. Create a new project and add MySQL plugin
3. Deploy the server folder:
   - Connect your GitHub repository or use Railway CLI
   - Set the root directory to `server`
4. Add environment variables in Railway dashboard:
   ```
   DATABASE_URL (automatically set by MySQL plugin)
   JWT_SECRET
   JWT_EXPIRE
   CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET
   FRONTEND_URL (your Vercel URL)
   NODE_ENV=production
   ```
5. Railway will automatically run the database migrations and start your server

### Deploy Frontend to Vercel

1. Create a [Vercel](https://vercel.com/) account
2. Import your GitHub repository
3. Set the root directory to `client`
4. Add environment variables:
   ```
   REACT_APP_API_URL=your-railway-backend-url
   REACT_APP_SOCKET_URL=your-railway-backend-url
   ```
5. Deploy

After deployment, update the `FRONTEND_URL` in your Railway backend environment variables to match your Vercel URL.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

### Rooms
- `GET /api/rooms/public` - Get all public rooms
- `GET /api/rooms/my-rooms` - Get user's rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create new room
- `POST /api/rooms/:id/join` - Join room
- `DELETE /api/rooms/:id/leave` - Leave room
- `GET /api/rooms/:id/members` - Get room members

### Messages
- `GET /api/messages/room/:roomId` - Get room messages
- `GET /api/messages/private/:userId` - Get private messages
- `POST /api/messages/upload` - Upload file

## Socket.io Events

### Client to Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send message to room
- `private_message` - Send private message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `typing_start_private` - Start typing in private chat
- `typing_stop_private` - Stop typing in private chat

### Server to Client
- `new_message` - Receive new room message
- `new_private_message` - Receive private message
- `typing_update` - Typing status update
- `typing_update_private` - Private chat typing update
- `user_status` - User online/offline status
- `online_users` - List of online users
- `user_joined_room` - User joined room notification
- `user_left_room` - User left room notification

## Project Structure

```
chat-app/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   ├── socket/            # Socket.io handlers
│   └── server.js          # Main server file
├── client/                # Frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # React components
│       ├── services/      # API and Socket services
│       ├── context/       # React context
│       └── App.jsx        # Main App component
└── database/              # Database schema
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists and schema is imported

### Socket.io Connection Failed
- Check that backend server is running
- Verify CORS settings allow frontend origin
- Check firewall settings

### File Upload Issues
- Verify Cloudinary credentials
- Check file size limits (default 10MB)
- Ensure allowed file types are correct

## Future Enhancements

- Message reactions and emoji picker
- Voice and video calls
- Message search functionality
- User profiles with avatars
- Push notifications
- Message read receipts
- Dark mode toggle
- Admin panel for room management

## License

MIT

## Contributing

Feel free to submit issues and pull requests!

## Author

Built with Claude Code
