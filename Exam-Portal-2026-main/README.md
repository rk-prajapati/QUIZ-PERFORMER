# Exam Quiz Portal

## Run locally

1. Extract the ZIP file.
2. Open the `Exam-Quiz` folder.
3. Open `index.html` in Chrome, Edge, or Firefox.

For the best local experience, you can also open the folder with VS Code and use the Live Server extension.

## Administrator page

Open `admin.html` from the login page to manage quizzes and view locally stored
student results. No database configuration or administrator password is needed.

## Working features

- Student registration and login
- Direct local admin dashboard
- Create, edit, and delete quizzes
- Student quiz search and category filters
- Timed quiz attempts with auto-save and auto-submit
- Fresh randomized question and option order on every new quiz attempt
- Exact question order is preserved when the same attempt is refreshed
- 29 built-in exam types with exactly 5 questions in every exam
- Class-wise basic quizzes for Class 1 through Class 6
- Automatic score, percentage, pass/fail status, and answer review after submission
- Returning students can use the direct Login & Play Again flow
- Copyright footer: Prathmesh Dake
- Result history and answer review
- Printable result, PDF result, and certificate
- Leaderboard and admin analytics
- Excel-compatible CSV result export
- Responsive layout and light/dark theme

Users, quizzes, progress, and results are stored in the browser with LocalStorage.
No Supabase project, API key, backend, or deployment environment variable is required.

## Netlify deployment

Deploy the `Exam-Quiz` folder directly. Netlify does not need a build command or
any deployment variables.
