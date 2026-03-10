# Quiz Master

A modern, enterprise-grade, multi-role online quiz application. This platform provides dedicated interfaces for both **Students** and **Teachers**, allowing dynamic quiz creation, deep section hierarchies, and real-time student progress tracking.

## Features

*   **Multi-Role Authentication**: Separate login and registration flows for Students and Teachers.
*   **Deep Subject Hierarchy**: 6 distinct subjects, each featuring 10 progressive difficulty sections (Easy, Medium, Hard).
*   **Procedural Seeding**: Automatically seeds a SQLite database with 600 ultra-realistic, subject-specific questions upon first run.
*   **Teacher Dashboard**:
    *   Add custom questions dynamically to specific subjects and sections.
    *   View real-time progress, scores, and timestamps for all students across all sections.
*   **Student Dashboard**:
    *   Browse subjects and drill down into specific difficulty sections.
    *   Take quizzes with instant visual feedback and a precise countdown timer.
    *   View final scores through a beautiful dynamic progress ring.
*   **Enterprise UI/UX**: Built with an ultra-clean, full-screen SaaS aesthetic, utilizing the Inter font, subtle drop shadows, custom background graphics, and responsive cards.

## Technology Stack

*   **Frontend**: HTML5, Vanilla JavaScript (SPA architecture), CSS3 (Custom Properties, Flexbox/Grid)
*   **Backend**: Node.js, Express.js
*   **Database**: SQLite (`sqlite3`)

## Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

## Installation & Setup

1.  **Open the Project**:
    Navigate to the project directory in your terminal.

2.  **Install Dependencies**:
    Run the following command to install the required Node.js packages (`express`, `sqlite3`, `cors`):
    ```bash
    npm install
    ```

3.  **Run the Server**:
    Start the backend application with Node:
    ```bash
    node server.js
    ```
    *Note: If the `quiz.db` file is ever deleted, running this command will seamlessly rebuild it and re-seed all 600 dynamic questions automatically.*

4.  **Open the Application**:
    Once the server is running, open your web browser and navigate to:
    **[http://localhost:3000](http://localhost:3000)**

## Usage Guide

*   **Default Teacher Account**: You can quickly test the teacher features by logging in with the username: `admin` and password: `admin`.
*   **For Teachers**: Log in to add custom questions to the database or open the "Student Progress" table to track grades globally.
*   **For Students**: Register a new account as a Student. Log in, select a subject, pick a progressively difficult section, and begin testing your knowledge!
