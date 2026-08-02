# HealthClinic - Full-Stack Medical Management System 

This project is a complete web application designed to manage medical appointments, patient records, and clinical prescriptions. It features a robust architecture connecting a Vanilla JavaScript FrontEnd with a Python Flask REST API, utilizing MongoDB for persistent and flexible data storage.

##  Features

* **Secure Access Validation:** Medical staff can authenticate into the system using their registered email and RUT credentials.
* **Interactive Dashboard:** Displays real-time KPIs (appointments today, total patients, pending appointments) and a dynamic table to filter appointments by their current status.
* **Clinical Records Management:** Allows doctors to search for patients and view their complete medical history, including past diagnoses and active medications.
* **Dynamic Prescriptions & Diagnostics:** Features a dynamic form to record new clinical diagnoses (including CIE-10 codes) and add multiple medications to a single prescription before saving it to the database.
* **RESTful API Architecture:** The frontend communicates with a custom Flask backend using the Fetch API to process JSON payloads securely.
* **External API Integration:** Includes a real-time weather widget powered by the asynchronous fetching of the OpenWeatherMap API.

##  Technologies Used

**FrontEnd:**
* **HTML5 & CSS3:** Responsive Single Page Application (SPA) layout utilizing CSS Grid and Flexbox, with custom CSS variables for a clean and professional UI.
* **Vanilla JavaScript:** Handles DOM manipulation, view toggling, and asynchronous API requests without external frameworks.

**BackEnd & Database:**
* **Python (Flask):** Serves REST API endpoints and handles Cross-Origin Resource Sharing (CORS) for seamless frontend communication.
* **MongoDB (PyMongo):** NoSQL database utilized for flexible data storage and fast querying.
* **Database Seeding:** Includes a custom `init_db.py` script to automatically drop, create, and populate initial collections (doctors, patients, appointments, and medications).

##  How to Run Locally

1. **Initialize the Database:** Ensure MongoDB is running locally on port 27017, then execute the seeding script to populate the database:
   ```bash
   python init_db.py
   
## Author:

* **Yerko T. Hermosilla** - *Full-Stack Development & API Design* - [GitHub Profile](https://github.com/Khy-Lnk)
<img width="1908" height="881" alt="flask-mongodb-medical" src="https://github.com/user-attachments/assets/d208f16a-9bc9-4299-8f33-a84a0579343a" />
