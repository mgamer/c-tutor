#include <iostream>
#include <cmath>
#include <iomanip>
#include <string>
using namespace std;
int main() {
    cout << sqrt(16) << " " << pow(2, 10) << " " << abs(-5) << " " << fabs(-2.5) << endl;
    cout << floor(2.7) << " " << ceil(2.1) << " " << round(2.5) << " " << round(-2.5) << endl;
    cout << max(3, 9) << " " << min(3, 9) << " " << max(2.5, 1.0) << endl;
    double pi = 3.14159265358979;
    cout << setprecision(3) << pi << endl;
    cout << fixed << setprecision(1) << pi << " " << 2.0 << endl;
    cout << setw(5) << 42 << "|" << endl;
    cout << left << setw(6) << "ab" << "|" << endl;
    int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int s = 0;
    for (int r = 0; r < 2; r++) for (int c = 0; c < 3; c++) s += grid[r][c];
    cout << s << endl;
    int x = 10;
    int& ref = x;
    ref += 5;
    cout << x << endl;
    double avg = (double)7 / 2;
    cout << avg << " " << static_cast<int>(3.99) << endl;
    cout << 5 / 2 << endl;
    return 0;
}
