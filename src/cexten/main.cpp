#include <iostream>
#include <limits>
#include <cmath>
#include <iomanip>
#include <array>
#include <vector>

extern int add(int x, int y);

int main() {
    int sum = add(1,3);
    std::cout << std::setfill('*') <<std::setw(20) << "Hello word! \n";  // prints "Hello word!"
    std::cout << "Sum is: " << sum << std::endl;
    double pi = 3.14159265358979323846;
    std::cout << std::setprecision(3) << pi << std::endl;
    std::cout << "Square root of 2 is: " << std::sqrt(2) << std::endl;

    std::array<int, 5> arr = {1, 2, 3, 4, 5};
    for (auto i : arr) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    std::cout << "Array size is: " << arr.size() << std::endl;


    std::vector<int> vec;
    
    vec.push_back(10);
    vec.push_back(20);
    vec.push_back(30);

    std::cout << "Vector size is: " << vec.size() << std::endl;

    for (auto i : vec) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    vec.push_back(40);
    vec.push_back(50);

    std::cout << "Vector size is: " << vec.size() << std::endl;

    for (auto i : vec) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    vec.push_back(60);
    vec.push_back(70);

    std::cout << "Vector size is: " << vec.size() << std::endl;

    for (auto i : vec) {
        std::cout << i << " ";
    }
    std::cout << std::endl;   

    vec.clear();
    if(vec.empty()) {
        std::cout << "Vector is empty." << std::endl;
    } else {
        std::cout << "Vector is not empty." << std::endl;
    }
    return 0;
}