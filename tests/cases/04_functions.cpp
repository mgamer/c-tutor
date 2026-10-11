#include <iostream>
#include <string>
using namespace std;
int square(int x);
void swapIt(int& a, int& b) { int t = a; a = b; b = t; }
int fib(int n) { if (n < 2) return n; return fib(n - 1) + fib(n - 2); }
double avg(double a, double b) { return (a + b) / 2; }
int avg(int a, int b, int c) { return (a + b + c) / 3; }
string greet(string who) { return "Hi, " + who + "!"; }
void noChange(int x) { x = 100; }
void addOne(int arr[], int n) { for (int i = 0; i < n; i++) arr[i]++; }
long long power(long long b, int e) { long long r = 1; for (int i = 0; i < e; i++) r *= b; return r; }
int counter = 0;
void tick() { counter++; }
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;
    return true;
}
int main() {
    int a = 3, b = 9;
    swapIt(a, b);
    cout << a << " " << b << endl;
    cout << square(12) << " " << fib(20) << endl;
    cout << avg(3, 4) << " " << avg(3, 4, 6) << " " << avg(2.5, 3.0) << endl;
    cout << greet("Emmet") << endl;
    noChange(a);
    cout << a << endl;
    int arr[4] = {1, 2, 3};
    addOne(arr, 4);
    for (int i = 0; i < 4; i++) cout << arr[i];
    cout << endl;
    cout << power(2, 40) << endl;
    tick(); tick(); tick();
    cout << counter << endl;
    for (int i = 0; i < 30; i++) if (isPrime(i)) cout << i << " ";
    cout << endl;
    return 0;
}
int square(int x) { return x * x; }
