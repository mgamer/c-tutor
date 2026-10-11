#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;
int sum(const vector<int>& v) { int s = 0; for (int x : v) s += x; return s; }
vector<int> evens(int n) { vector<int> r; for (int i = 0; i <= n; i += 2) r.push_back(i); return r; }
int main() {
    vector<int> v;
    for (int i = 0; i < 5; i++) v.push_back(i * i);
    cout << v.size() << " " << v.front() << " " << v.back() << " " << v[2] << " " << v.at(3) << endl;
    v.pop_back();
    cout << sum(v) << " " << v.empty() << endl;
    vector<int> w = v;
    w[0] = 99;
    cout << v[0] << " " << w[0] << endl;
    vector<int> e = evens(10);
    for (size_t i = 0; i < e.size(); i++) cout << e[i] << " ";
    cout << endl;
    vector<string> names = {"Wyldstyle", "Emmet", "Batman", "Unikitty"};
    sort(names.begin(), names.end());
    for (const string& n : names) cout << n << " ";
    cout << endl;
    vector<int> nums = {4, 8, 1, 9, 3};
    sort(nums.begin(), nums.end(), greater<int>());
    for (int n : nums) cout << n;
    cout << endl;
    cout << *max_element(nums.begin(), nums.end()) << " " << *min_element(nums.begin(), nums.end()) << endl;
    vector<vector<int>> grid(3, vector<int>(4, 0));
    grid[1][2] = 7;
    for (auto& row : grid) { for (int c : row) cout << c; cout << endl; }
    vector<int> z(3);
    z.insert(z.begin() + 1, 5);
    z.erase(z.begin());
    for (int q : z) cout << q;
    cout << endl;
    int a[] = {5, 2, 8, 1};
    sort(a, a + 4);
    for (int i = 0; i < 4; i++) cout << a[i];
    cout << " " << sizeof(a) / sizeof(a[0]) << endl;
    reverse(nums.begin(), nums.end());
    for (int n : nums) cout << n;
    cout << endl;
    v.clear();
    cout << v.size() << endl;
    return 0;
}
