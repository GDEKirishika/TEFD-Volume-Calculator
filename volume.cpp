#include <cmath>

extern "C" {

double calculate_volume(double h, double a1, double b1, double a2, double b2, double r, double twist) {
    // Volume of elliptical frustum: h/3 * (A1 + sqrt(A1*A2) + A2)
    double A1 = M_PI * a1 * b1;
    double A2 = M_PI * a2 * b2;
    double V_frustum = h / 3.0 * (A1 + sqrt(A1 * A2) + A2);
    
    // Assume dome is a spherical cap with height h_dome = r / 2
    double h_dome = r / 2.0;
    double V_dome = M_PI * h_dome * h_dome * (3 * r - h_dome) / 3.0;
    
    // Twist does not affect volume
    return V_frustum + V_dome;
}

}