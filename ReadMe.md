
# Project Setup and Instructions

This project allows you to create and manage prescriptions. To run the project locally and build it for distribution, follow the instructions below.

## Prerequisites

Before getting started, ensure that you have the following installed on your system:

- [Node.js](https://nodejs.org/en/) (version 14.x or higher)
- [Yarn](https://yarnpkg.com/) for managing dependencies
- [Electron](https://www.electronjs.org/) for building the desktop app
- [Git](https://git-scm.com/) to clone the repository

## Setup Instructions

### 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone <your-repository-url>
cd <project-folder>
```

### 2. Create a `.env` File

In the root directory of your project, create a `.env` file with the following environment variables:

```ini
NODE_ENV=development
VITE_API_URL=<API_BASE_URL>  # Replace with your API base URL
OFFLINE_DB_NAME=medDB_PrecP
```

Make sure to replace `<API_BASE_URL>` with your actual API base URL.

### 3. Install Project Dependencies

Run the following command to install all necessary dependencies for the project:

```bash
yarn install
```

### 4. Running the Project in Development Mode

To start the application in development mode, use the following command:

```bash
yarn start
```

This will launch the project locally. You can view it in the browser or use the Electron app interface.

### 5. Building the Application (Linux Only)

If you want to build the application for Linux (tested on Linux only), you can run the following command:

```bash
yarn electron:build:deb
```

This will generate a `.deb` package for your system.

## Additional Notes

- **Development Mode:** After starting the application, you can make changes to the source code, and the application will automatically update. To see your changes, simply refresh or restart the app.
- **Production Mode:** For production, make sure you update your `.env` variables accordingly to match the live environment.
  
## Troubleshooting

If you encounter issues:

1. Ensure that all dependencies are installed correctly by running `yarn install`.
2. Verify that your `.env` file contains the correct values.
3. Check the console for error messages and consult the documentation of any libraries that may be causing issues.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
```

Simply create a new file named `README.md` in the root of your project and paste this content into it.