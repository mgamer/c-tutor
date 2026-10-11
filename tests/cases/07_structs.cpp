#include <iostream>
#include <string>
#include <vector>
using namespace std;
struct Brick {
    string color;
    int width;
    int length;
    int studs() { return width * length; }
};
struct Point { int x; int y; };
struct Counter {
    int value = 10;
    void add(int n) { value += n; }
};
void grow(Brick& b) { b.length++; }
Point mid(Point a, Point b) { Point p; p.x = (a.x + b.x) / 2; p.y = (a.y + b.y) / 2; return p; }
int main() {
    Brick b = {"red", 2, 4};
    cout << b.color << " " << b.studs() << endl;
    grow(b);
    cout << b.studs() << endl;
    Brick c = b;
    c.color = "blue";
    cout << b.color << " " << c.color << endl;
    vector<Brick> pile;
    pile.push_back(b);
    pile.push_back({"green", 1, 1});
    pile[1].width = 3;
    int total = 0;
    for (Brick& p : pile) total += p.studs();
    cout << total << endl;
    Point m = mid({0, 0}, {10, 4});
    cout << m.x << "," << m.y << endl;
    Counter k;
    k.add(5);
    cout << k.value << endl;
    return 0;
}
