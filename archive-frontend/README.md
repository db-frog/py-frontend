# Archive Frontend

This repository contains the frontend for an online folklore archive. The application is built using **Vue 3**, **Vite**, and **TypeScript**, with a responsive UI optimized for desktop and mobile. It allows users to browse, search, and interact with digitized folklore materials stored in a MongoDB backend.

## Features

- **Dynamic Table View**: Users can explore folklore records in an interactive, filterable table.

- **Folklore Collection Management**: View and interact with metadata for digitized folklore materials.

- **Folklore Item Modal**: Provides detailed metadata views for individual folklore records.

- **Future Enhancements**:

  - Authentication
  - Mobile views
  - "Random Item" feature for serendipitous discovery.
  - Folder-based browsing to replicate the original archive structure.
  - Vector search for more advanced query capabilities.

## Tech Stack

- **Vue 3 + Vite**: Modern, fast frontend development.
- **TypeScript**: Strongly-typed JavaScript for improved maintainability.
- **Tailwind CSS**: Simplified styling and responsive design.
- **MongoDB (via Backend API)**: Stores metadata and archive content.
- **AWS Lambda & S3 Integration** (Backend): Automates metadata extraction from OCR’d PDFs.
- **Docker**: Containerized deployment for easy hosting.

## Project Structure

The project follows a modular structure with key components organized as follows:

- **`src/components/`**: Contains reusable UI components such as tables, modals, and search bars.
- **`src/views/`**: Includes main pages and views, such as the collection display and item details.
- **`src/composables/`**: Manages composable functions, including logic for interacting with the folklore collection.
- **`src/assets/`**: Stores static assets like images and styles.
- **`src/types/`**: TypeScript definitions for consistent type checking.
- **`tsconfig.json`**: Central TypeScript configuration that references other configs.
- **`tsconfig.app.json`**: TypeScript configuration for the application source files.
- **`tsconfig.node.json`**: Configuration for Node.js-specific TypeScript files (e.g., build scripts and Vite config).
- **`package.json`**: Manages dependencies, scripts, and project metadata.
- **`nginx.conf`**: Configuration for serving the frontend using Nginx

## Project Setup

### Install Dependencies

```sh
npm install
```

### Start Development Server

```sh
npm run dev
```

### Build for Production

```sh
npm run build
```

## Docker Deployment

To build and deploy the frontend as a Docker container for **Reclaim Cloud**:

```sh
docker build -t archive-frontend . --platform linux/amd64
```

You can then run the container with:

```sh
docker run -d -p 8080:80 archive-frontend
```

## Contribution Guide

1. Clone the repository:

   ```sh
   git clone https://github.com/your-repo/archive-frontend.git
   cd archive-frontend
   ```

2. Create a new branch for your feature/fix:

   ```sh
   git checkout -b feature-branch-name
   ```

3. Commit changes with a descriptive message:

   ```sh
   git commit -m "Add feature X"
   ```

4. Push the branch and open a pull request.

   ```sh
   git push origin feature-branch-name
   ```

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).

---

For any questions or support, please contact the repository maintainer.

