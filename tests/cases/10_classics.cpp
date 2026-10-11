#include <iostream>
#include <vector>
#include <string>
using namespace std;
void bubble(vector<int>& a) {
    for (int i = 0; i < (int)a.size() - 1; i++)
        for (int j = 0; j < (int)a.size() - 1 - i; j++)
            if (a[j] > a[j + 1]) swap(a[j], a[j + 1]);
}
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
string binary(int n) { if (n == 0) return "0"; string s = ""; while (n > 0) { s = char('0' + n % 2) + s; n /= 2; } return s; }
int main() {
    vector<int> a = {9, 4, 7, 1, 8, 2};
    bubble(a);
    for (int x : a) cout << x << " ";
    cout << endl << gcd(84, 36) << " " << binary(37) << endl;
    bool sieve[50];
    for (int i = 0; i < 50; i++) sieve[i] = true;
    for (int i = 2; i < 50; i++) if (sieve[i]) for (int j = i * i; j < 50; j += i) sieve[j] = false;
    for (int i = 2; i < 50; i++) if (sieve[i]) cout << i << ",";
    cout << endl;
    int secret = 37, guess, tries = 0;
    while (cin >> guess) {
        tries++;
        if (guess < secret) cout << "Higher!" << endl;
        else if (guess > secret) cout << "Lower!" << endl;
        else { cout << "Got it in " << tries << endl; break; }
    }
    string s = "A man a plan";
    string clean = "";
    for (char c : s) if (c != ' ') clean += tolower(c);
    cout << clean << endl;
    int table[4][4];
    for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) table[i][j] = (i + 1) * (j + 1);
    for (int i = 0; i < 4; i++) { for (int j = 0; j < 4; j++) cout << table[i][j] << "\t"; cout << "\n"; }
    return 0;
}
