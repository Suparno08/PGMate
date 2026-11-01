# PGMate - Requirements Specification

## 1. Project Overview

PGMate is a student-focused accommodation discovery platform that helps students find, compare, and choose suitable PGs and hostels based on location, monthly budget, rating, and available facilities.

The application should provide a simple and modern user experience while using a serverless AWS architecture for the backend.

---

## 2. Goals

The main goals of PGMate are:

- Help students discover nearby PGs and hostels.
- Allow students to filter PGs based on location and budget.
- Display important PG information such as rent, distance, rating, and facilities.
- Allow users to compare multiple PGs.
- Provide an AI assistant for accommodation recommendations.
- Provide user authentication.
- Store PG and user data using serverless AWS services.
- Deploy the application as a live cloud application.

---

## 3. Target Users

The primary users are:

- College students
- University students
- Students moving to a new city
- Students looking for affordable accommodation near their college

---

## 4. Core Features

### 4.1 PG Search

Users should be able to search for PGs or hostels using:

- Location
- Monthly budget

The system should return PGs matching the user's requirements.

---

### 4.2 Budget Filter

Users should be able to select their maximum monthly accommodation budget.

The system should use the selected budget when filtering PG results.

---

### 4.3 Location Search

Users should be able to enter a location such as:

- Agarpara
- Kolkata
- JIS University
- Nearby college locations

The system should use the location when finding suitable PGs.

---

### 4.4 PG Listings

Each PG listing should display:

- PG name
- Location
- Monthly rent
- Distance
- Rating
- Available facilities
- Basic description

Example facilities:

- Wi-Fi
- Food
- AC
- Laundry

---

### 4.5 PG Comparison

Users should be able to compare multiple PGs.

The comparison should include:

- Monthly rent
- Distance
- Rating
- Facilities
- Other relevant information

The comparison interface should make differences between PGs easy to understand.

---

### 4.6 AI Assistant

PGMate should provide an AI assistant that helps users find suitable PGs.

Users should be able to ask questions such as:

- "Find a PG near JIS under ₹7000"
- "Show me affordable PGs with Wi-Fi"
- "Which PG is closest to my college?"
- "Compare these PGs"

The assistant should use available PG information when generating recommendations.

---

### 4.7 User Authentication

Users should be able to:

- Sign up
- Log in
- Log out

Authentication should be implemented using Amazon Cognito.

---

### 4.8 User Preferences

Authenticated users may store preferences such as:

- Preferred location
- Maximum monthly budget
- Required facilities

These preferences can be used to improve recommendations.

---

## 5. Data Requirements

The application should maintain PG accommodation records.

Each PG record should contain information such as:

```text
id
name
location
rent
distance
rating
description
facilities
contact information