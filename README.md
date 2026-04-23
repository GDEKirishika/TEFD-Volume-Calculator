# Twisted Elliptical Frustum Dome Volume Calculator

A web app to calculate the volume of a twisted elliptical frustum dome.

## Prerequisites

- A web browser.

## Run

Open `index.html` in a web browser.

Enter the parameters and click Calculate.

## Parameters

- h: Height of the frustum
- a1, b1: Semi-axes of the bottom ellipse
- a2, b2: Semi-axes of the top ellipse
- r: Radius of the dome
- twist: Twist angle (not used in volume calculation)

## Formula

Volume = Volume of elliptical frustum + Volume of spherical cap dome

Elliptical frustum: h/3 * (A1 + sqrt(A1*A2) + A2) where A = π*a*b

Dome: π*h_dome²*(3r - h_dome)/3 with h_dome = r/2

## Debug

Use the debug configuration in VS Code.