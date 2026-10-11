#include <iostream>
using namespace std;
int main() {
    int a = 17, b = 5;
    cout << a + b << " " << a - b << " " << a * b << " " << a / b << " " << a % b << endl;
    cout << -17 / 5 << " " << -17 % 5 << endl;
    double d = 17.0 / 5;
    cout << d << endl;
    cout << 10 / 4 * 4.0 << " " << 10 / 4.0 * 4 << endl;
    const int MAX = 3;
    int x = MAX;
    x += 4; x *= 3; x -= 1; x /= 2; x %= 7;
    cout << x << endl;
    int i = 5;
    cout << i++ << " " << i << " " << ++i << endl;
    bool t = true, f = false;
    cout << (t && f) << (t || f) << !t << endl;
    cout << (5 > 3) << (5 == 3) << (5 != 3) << endl;
    char c = 'A';
    c++;
    cout << c << " " << int(c) << " " << (char)(c + 1) << endl;
    long long big = 1000000LL * 1000000;
    cout << big << endl;
    int ov = 2000000000;
    ov = ov + ov;
    cout << ov << endl;
    unsigned int u = 0; u--; cout << u << endl;
    cout << 7 / 2.0 << " " << 1.0 / 3 << " " << 2.0 / 3 * 3 << " " << 100.0 << " " << 1e-5 << " " << 123456.7 << endl;
    cout << 0.000123 << " " << 1e15 << " " << -2.5 << " " << 3.0 << endl;
    int tern = a > b ? a : b;
    cout << tern << endl;
    cout << (a & b) << " " << (a | b) << " " << (a ^ b) << " " << (a << 2) << " " << (a >> 1) << endl;
    return 0;
}
