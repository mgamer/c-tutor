#include <iostream>
using namespace std;
int main() {
    for (int i = 1; i <= 15; i++) {
        if (i % 15 == 0) cout << "FizzBuzz";
        else if (i % 3 == 0) cout << "Fizz";
        else if (i % 5 == 0) cout << "Buzz";
        else cout << i;
        cout << (i < 15 ? "," : "\n");
    }
    int n = 0;
    while (true) { n++; if (n == 3) continue; if (n > 6) break; cout << n; }
    cout << endl;
    int k = 10;
    do { cout << k << " "; k -= 3; } while (k > 0);
    cout << endl;
    for (int r = 1; r <= 4; r++) {
        for (int s = 0; s < 4 - r; s++) cout << " ";
        for (int b = 0; b < 2 * r - 1; b++) cout << "#";
        cout << endl;
    }
    for (int i = 0, j = 10; i < j; i += 3, j -= 2) cout << i << "-" << j << " ";
    cout << endl;
    for (char c = 'a'; c <= 'e'; c++) {
        switch (c) {
            case 'a': case 'e': cout << "vowel "; break;
            default: cout << c << " ";
        }
    }
    cout << endl;
    return 0;
}
