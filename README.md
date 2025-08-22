]# Saraha

## Description
Saraha is an anonymous messaging application that allows users to send and receive messages without revealing their identity. The application consists of a backend built with Node.js and a frontend developed using React.

## Installation Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd saraha
   ```

2. Install backend dependencies:
   ```bash
   cd src
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Create a `.env` file in the `src` directory and add your environment variables.

## Usage
To start the backend server:
```bash
npm run dev
```

To start the frontend application:
```bash
cd frontend
npm start
```

## API Endpoints
### Authentication
- **POST** `/api/auth/register`: Register a new user.
- **POST** `/api/auth/login`: Log in an existing user.
- **POST** `/api/auth/verify-account`: Verify user account with OTP.
- **POST** `/api/auth/forgot-password`: Request OTP for password reset.

### User Profile
- **GET** `/api/user/me`: Get the current user's profile.
- **PUT** `/api/user/me`: Update the user's profile.

### Messages
- **POST** `/api/messages/:username`: Send an anonymous message to a user.
- **GET** `/api/messages/my`: Get messages sent to the current user.
- **DELETE** `/api/messages/:id`: Delete a specific message.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
