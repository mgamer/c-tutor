#include <iostream>
#include <string>
using namespace std;
int main() {
    int n;
    cin >> n;
    string name;
    cin >> name;
    double h;
    cin >> h;
    char ch;
    cin >> ch;
    cin.ignore(1000, '\n');
    string line;
    getline(cin, line);
    cout << n << "|" << name << "|" << h << "|" << ch << "|" << line << "|" << endl;
    int x, total = 0, count = 0;
    while (cin >> x) { total += x; count++; }
    cout << total << " " << count << endl;
    return 0;
}
