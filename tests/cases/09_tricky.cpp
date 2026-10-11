#include <iostream>
#include <vector>
#include <string>
#include <numeric>
#include <algorithm>
#include <iomanip>
using namespace std;
struct Minifig {
    string name;
    vector<string> items;
    Minifig(string n) : name(n) {}
    void give(string it) { items.push_back(it); }
    int count() const { return items.size(); }
};
struct Team { string title; vector<int> scores; };
vector<int> global = {3, 1, 2};
int calls = 0;
void hanoi(int n, char a, char b, char c) { calls++; if (n == 0) return; hanoi(n - 1, a, c, b); hanoi(n - 1, c, b, a); }
bool cmpLen(const string& a, const string& b) { if (a.size() != b.size()) return a.size() < b.size(); return a < b; }
int main() {
    Minifig m("Emmet");
    m.give("wrench"); m.give("cape");
    cout << m.name << " has " << m.count() << " items: " << m.items[1] << endl;
    Team t;
    t.title = "Blue";
    t.scores.push_back(5); t.scores.push_back(7);
    cout << t.title << " " << accumulate(t.scores.begin(), t.scores.end(), 0) << endl;
    sort(global.begin(), global.end());
    for (vector<int>::size_type i = 0; i < global.size(); i++) cout << global[i];
    cout << endl;
    hanoi(5, 'A', 'B', 'C');
    cout << calls << endl;
    vector<string> w = {"bb", "a", "ccc", "ab", "c"};
    sort(w.begin(), w.end(), cmpLen);
    for (auto& s : w) cout << s << ' ';
    cout << endl;
    for (auto it = global.begin(); it != global.end(); ++it) cout << *it * 10 << " ";
    cout << endl;
    cout << setfill('0') << setw(3) << 7 << " " << scientific << 12345.678 << endl;
    cout << defaultfloat << 1.5e-7 << " " << 1.0e20 << endl;
    long long f = 1;
    for (int i = 1; i <= 20; i++) f *= i;
    cout << f << endl;
    int prod = 50000 * 50000;
    cout << prod << endl;
    int x = 5;
    string r = x > 3 ? (x > 4 ? "big" : "mid") : "small";
    cout << r << endl;
    cout << ('a' < 'b') << (string("apple") < string("banana")) << ('Z' + 1) << endl;
    int n;
    cin >> n;
    string rest;
    getline(cin, rest);
    string full;
    getline(cin, full);
    cout << n << "[" << rest << "][" << full << "]" << endl;
    vector<vector<int>> g(2, vector<int>(3));
    for (int i = 0; i < 2; i++) for (int j = 0; j < 3; j++) cin >> g[i][j];
    int best = g[0][0];
    for (auto& row : g) for (int v : row) best = max(best, v);
    cout << best << endl;
    double d = 10;
    d /= 4;
    cout << d << " " << int(d) << " " << (int)(-d) << endl;
    char c = 'x';
    c += 2;
    cout << c << endl;
    bool b = 5;
    cout << b << " " << (b + b) << endl;
    cout << 7 % -3 << " " << -7 % 3 << endl;
    return 0;
}
