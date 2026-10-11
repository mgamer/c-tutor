#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
bool isPal(string s) { string r = s; reverse(r.begin(), r.end()); return r == s; }
int main() {
    string s = "Everything is awesome";
    cout << s.length() << " " << s.substr(0, 10) << "|" << s.find("is") << " " << s[3] << endl;
    if (s.find("zzz") == string::npos) cout << "not found" << endl;
    int vowels = 0;
    for (char c : s) if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') vowels++;
    cout << vowels << endl;
    string up = s;
    for (char& c : up) c = toupper(c);
    cout << up << endl;
    for (int i = 0; i < (int)up.size(); i++) up[i] = tolower(up[i]);
    cout << up << endl;
    cout << isPal("racecar") << isPal("lego") << endl;
    string t = "abc";
    t += 'd';
    t += "ef";
    t.push_back('g');
    cout << t << " " << (t < "abd") << " " << ("x" + t) << endl;
    string code = "hello";
    for (char& c : code) c = (c - 'a' + 3) % 26 + 'a';
    cout << code << endl;
    cout << to_string(42) + "!" << " " << stoi("123") + 1 << " " << stod("2.5") * 2 << endl;
    int digits = 0;
    string mix = "a1b2c33";
    for (char c : mix) if (isdigit(c)) digits += c - '0';
    cout << digits << endl;
    string words = "one two three";
    int spaces = count(words.begin(), words.end(), ' ');
    cout << spaces + 1 << endl;
    string x = "brick";
    x.insert(0, "red ");
    x.erase(0, 1);
    cout << x << " " << x.empty() << endl;
    string rep(5, '*');
    cout << rep << endl;
    return 0;
}
