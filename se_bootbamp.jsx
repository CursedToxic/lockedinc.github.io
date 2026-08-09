import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal, GitBranch, GitCommit, GitMerge, Cpu, Shield, Globe, Bot,
  FolderGit2, Braces, ChevronRight, RotateCcw, Trophy, Zap, Activity,
  CheckCircle2, XCircle, Lock, Star, ArrowLeft, Sparkles, Clock, Check,
  Settings, Eye, EyeOff, Upload, FileText, X, Loader2
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONTENT — NSW Software Engineering 11–12 Syllabus, skill-tree bank */
/*  Each module is a small tree of 3 nodes (subtopics). Nodes unlock   */
/*  in order as you clear the one before them.                         */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    id: "prog-fund",
    year: 11,
    title: "Programming Fundamentals",
    file: "fundamentals.py",
    accent: "#7ee787",
    icon: Terminal,
    blurb: "SDLC, algorithms, data types & debugging.",
    nodes: [
      {
        id: "sdlc-algo",
        title: "SDLC & Algorithm Design",
        questions: [
          { q: "A team has just finished determining detailed specifications for a system. Which SDLC stage comes next?", options: ["Requirements definition", "Design", "Testing and debugging", "Installation"], correct: 1, note: "The typical order is requirements → specifications → design → development → integration → testing/debugging → installation → maintenance." },
          { q: "A routing algorithm splits a large map into quadrants, finds the best route within each quadrant, then stitches the partial routes into one. This best demonstrates:", options: ["Backtracking", "Divide and conquer", "Linear iteration", "Encapsulation"], correct: 1, note: "Divide and conquer breaks a problem into smaller subproblems, solves each, then combines the results." },
          { q: "A Sudoku solver fills a cell, and if a later cell can't be validly filled, it undoes the last placement and tries a different number. This strategy is:", options: ["Divide and conquer", "Top-down design", "Backtracking", "Iteration"], correct: 2, note: "Backtracking explores a path and retreats when it hits a dead end, trying an alternative." },
          { q: "Months after release, a team fixes a bug reported by users and adds a small enhancement they requested, without touching the original requirements. This work belongs to the:", options: ["Requirements definition stage", "Testing and debugging stage", "Maintenance stage", "Installation stage"], correct: 2, note: "Maintenance covers post-release fixes and minor enhancements over the system's lifetime." },
          { q: "One search checks every element in a list one by one until it finds a match. Another repeatedly halves a sorted list's search space each comparison. As the list grows very large, which pairing correctly describes their time complexity?", options: ["O(n) and O(log n) respectively", "O(log n) and O(n) respectively", "O(n²) and O(n) respectively", "O(1) and O(n) respectively"], correct: 0, note: "Linear search is O(n); binary search on a sorted list is O(log n), scaling far better as n grows." },
          { q: "An algorithm design is built entirely from sequence, selection and repetition, with no unpredictable jumps between arbitrary lines. This principle is:", options: ["Object-oriented programming", "Structured programming", "Functional decomposition", "Event-driven programming"], correct: 1, note: "Structured programming restricts control flow to sequence, selection and repetition for readability and reliability." },
          { q: "Before writing any code, a programmer manually traces through pseudocode line by line with sample values on paper, confirming the logic produces the right output. This practice is:", options: ["Path coverage testing", "Desk checking", "Regression testing", "Black box testing"], correct: 1, note: "Desk checking traces an algorithm's logic by hand before it's ever run, often followed by a peer check." },
          { q: "One subprogram calculates and returns a value used directly inside an expression elsewhere in the code, while another subprogram performs an action, such as printing a report, and returns nothing. These are respectively a:", options: ["Procedure; function", "Function; procedure", "Loop; branch", "Stub; watch"], correct: 1, note: "Functions return a value for use elsewhere; procedures perform an action without necessarily returning one." },
          { q: "One language expresses a solution as an explicit sequence of step-by-step commands that change program state ('set x to 5, then add 1'), while another declares facts and rules for an inference engine to reason over and query. These are respectively:", options: ["Imperative programming; logic programming", "Logic programming; imperative programming", "Functional programming; OOP", "OOP; functional programming"], correct: 0, note: "Imperative programming issues explicit sequential commands; logic programming states facts/rules queried by an inference engine." },
        ],
      },
      {
        id: "data-structures",
        title: "Data & Structures",
        questions: [
          { q: "Which representation lets a fixed-width binary number encode negative values without a separate sign flag?", options: ["ASCII encoding", "Floating point", "Two's complement", "Hexadecimal"], correct: 2, note: "Two's complement lets binary arithmetic handle negative integers using standard addition circuitry." },
          { q: "A variable must only ever hold one of two states — on or off. Which data type fits with no wasted design?", options: ["Char", "Real", "Integer", "Boolean"], correct: 3, note: "Boolean is the dedicated binary-state data type." },
          { q: "Before coding starts, a team documents every field's name, type, format and relationships across the system. This artefact is a:", options: ["Structure chart", "Class diagram", "Data dictionary", "Gantt chart"], correct: 2, note: "A data dictionary describes data, its types, structure and relationships as a planning tool." },
          { q: "A finance application repeatedly sums many small floating-point currency values, and the final total ends up off by a fraction of a cent. This is most directly caused by:", options: ["Integer overflow", "Floating-point rounding error", "Two's complement underflow", "ASCII encoding mismatch"], correct: 1, note: "Floating-point numbers can't represent every decimal value exactly, so repeated arithmetic accumulates small rounding errors." },
          { q: "An undo feature in a text editor must reverse the most recently performed action first, before any earlier one. Which structure's natural behaviour fits this requirement?", options: ["A queue (FIFO)", "A stack (LIFO)", "A fixed-size array only", "Linked-list traversal alone"], correct: 1, note: "A stack's last-in-first-out order naturally matches undoing the most recent action first." },
          { q: "An 8-bit unsigned integer field already holds 255, and the program adds 1 to it with no range check. What happens?", options: ["It correctly becomes 256", "It throws a syntax error", "It overflows and wraps around to 0", "It automatically converts to a floating-point value"], correct: 2, note: "Fixed-width unsigned integers wrap around to zero when incremented past their maximum representable value." },
          { q: "The hexadecimal value 2F is equivalent to which decimal number?", options: ["47", "45", "31", "74"], correct: 0, note: "Hexadecimal digit place values are powers of 16: (2×16) + 15 = 47." },
          { q: "A payroll program must process employee records strictly in the order they are stored on disk, one after another, and cannot jump directly to a specific record by position. This storage approach is a:", options: ["A hash table", "A sequential file", "A binary tree", "A stack"], correct: 1, note: "Sequential files are read and written in order, without direct random access to a specific record." },
          { q: "Two different keys used to store student records both map to the same index in a hash table. This scenario, which the table's design must resolve, is called a:", options: ["Stack overflow", "Hash collision", "Boundary error", "Buffer underflow"], correct: 1, note: "A collision occurs when two distinct keys hash to the same slot and must be resolved by the table's design." },
        ],
      },
      {
        id: "test-debug",
        title: "Testing & Debugging",
        questions: [
          { q: "A tester deliberately submits the minimum and maximum allowed values for an age field. This is:", options: ["Path coverage testing", "Faulty data testing", "Boundary value testing", "Regression testing"], correct: 2, note: "Boundary testing targets the edges of a valid input range, where off-by-one errors hide." },
          { q: "A developer marks line 42 so execution halts there every run, letting them inspect variables at that exact point. This is a:", options: ["Watch", "Breakpoint", "Single line step", "Debug output statement"], correct: 1, note: "Breakpoints pause execution at a chosen line for inspection." },
          { q: "A project delivers working software every two weeks, re-prioritising based on client feedback each cycle. This best reflects:", options: ["Waterfall", "Direct implementation", "Agile", "Pilot rollout"], correct: 2, note: "Agile develops in short, adaptive iterations rather than one long fixed sequence." },
          { q: "Code compiles and runs without crashing, but consistently calculates the wrong total due to an incorrect formula. This is a:", options: ["Syntax error", "Logic error", "Runtime error", "Integration error"], correct: 1, note: "Logic errors run fine but produce incorrect results because the reasoning in the code is flawed." },
          { q: "After fixing a bug in the payment module, a team re-runs its entire existing test suite to confirm no previously working feature broke as a side effect. This is:", options: ["Boundary testing", "Unit testing", "Regression testing", "Static analysis"], correct: 2, note: "Regression testing checks that new changes haven't broken existing functionality." },
          { q: "A developer wants to observe how a variable's value changes across every iteration of a loop, without pausing execution at each step. Which debugging tool best fits this?", options: ["A breakpoint", "A watch / trace table", "A single line step", "A syntax checker"], correct: 1, note: "A watch or trace table records a variable's values across execution without halting the program each time." },
          { q: "A test suite is designed so every possible route through a program's nested if-statements is executed at least once, not just the minimum and maximum input values. This test data strategy is:", options: ["Boundary value testing", "Path coverage testing", "Regression testing", "Grey box testing"], correct: 1, note: "Path coverage aims to exercise every possible execution path through the code's logic, a broader goal than boundary testing." },
          { q: "A bug appears only when function A passes data in a slightly different format than function B expects, even though each function works correctly when tested alone. Diagnosing this requires examining the:", options: ["Interface between the functions", "Boundary values only", "Two's complement representation", "Data dictionary formatting alone"], correct: 0, note: "Bugs at module boundaries often arise from mismatched assumptions about the data passed between functions." },
          { q: "A program is syntactically valid and its formula is logically sound, yet it crashes only when a user enters zero, because the code then divides by that value. This is best classified as a:", options: ["Syntax error", "Logic error", "Runtime error", "Integration error"], correct: 2, note: "Runtime errors occur during execution under specific conditions (like division by zero), distinct from a flaw in the logic itself." },
        ],
      },
      {
        id: "lang-translation",
        title: "Languages & Translation",
        questions: [
          { q: "A program written in a high-level language is fully converted into machine code before it ever runs, producing a standalone executable that no longer needs the original source. This translator is a(n):", options: ["Interpreter", "Compiler", "Assembler", "Debugger"], correct: 1, note: "Compilers translate an entire program to machine code ahead of time, producing an independent executable." },
          { q: "A translator executes a high-level program line by line, halting immediately when it reaches an error partway through, and never produces a separate executable file. This is a(n):", options: ["Compiler", "Interpreter", "Linker", "Assembler"], correct: 1, note: "Interpreters translate and execute code one line at a time, stopping at the first error encountered." },
          { q: "Which generation of programming languages uses mnemonics like MOV and ADD that map directly to machine instructions, requiring an assembler to convert them?", options: ["1GL — machine language", "2GL — assembly language", "3GL — high-level language", "4GL — query language"], correct: 1, note: "Assembly language (2GL) uses mnemonics that correspond one-to-one with machine instructions." },
          { q: "A non-technical user generates a report by writing a single statement describing what data they want, without specifying the step-by-step procedure to retrieve it. This best reflects a:", options: ["1GL", "2GL", "3GL", "4GL"], correct: 3, note: "4GLs (like SQL-style query languages) let users state what they want rather than how to compute it." },
          { q: "An IDE underlines a missing semicolon in red before the program is ever executed. This feature is an example of:", options: ["Runtime error detection", "Syntax highlighting only", "Static/compile-time error checking", "Version control integration"], correct: 2, note: "Static checking analyses code for errors like missing syntax before it runs." },
          { q: "A program compiles and runs correctly on the developer's machine, but the compiled binary won't run on a different processor architecture without recompiling. This limitation exists because:", options: ["Compiled code is translated directly into machine code specific to the target architecture", "Interpreters are architecture-independent", "All 3GLs are automatically architecture-independent", "Assembly language is portable across architectures"], correct: 0, note: "A compiler produces machine code tied to the instruction set of the architecture it targets." },
          { q: "A just-in-time (JIT) compiler translates bytecode into machine code while the program is already running, blending traits of interpretation and compilation. This hybrid approach is used because:", options: ["It avoids ever needing an interpreter at all", "It combines the faster startup of interpretation with the near-native speed of compiled code", "It only works for assembly language", "It removes the need for any translation whatsoever"], correct: 1, note: "JIT compilation translates during execution to balance startup speed against runtime performance." },
          { q: "A single high-level statement like `total = items * price` is automatically expanded into several lower-level machine instructions, entirely invisibly to the programmer. This illustrates why high-level languages are described as:", options: ["Machine-dependent", "More abstracted from hardware detail than assembly language", "Identical in structure to 2GLs", "Incapable of arithmetic"], correct: 1, note: "High-level languages abstract away the detailed machine instructions that assembly/machine code exposes directly." },
          { q: "A 3GL program must be recompiled separately for Windows, macOS and Linux to run natively on each, whereas a browser-based 4GL query only needs a compatible engine to interpret it anywhere. This illustrates a trade-off between:", options: ["Portability and closeness to hardware performance", "Boolean logic and integer math", "SDLC stages and testing", "Encapsulation and inheritance"], correct: 0, note: "Lower-level/compiled code tends to sit closer to the hardware (faster, less portable); higher-level/interpreted code favours portability over raw speed." },
        ],
      },
    ],
  },
  {
    id: "oop",
    year: 11,
    title: "The Object-Oriented Paradigm",
    file: "oop.class",
    accent: "#79c0ff",
    icon: Braces,
    blurb: "Objects, classes, inheritance & testing.",
    nodes: [
      {
        id: "core-concepts",
        title: "Core Concepts",
        questions: [
          { q: "A BankAccount class keeps its balance private and only allows changes through a validated withdraw() method. This illustrates:", options: ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"], correct: 2, note: "Encapsulation bundles data with methods and restricts direct outside access." },
          { q: "Circle, Square and Triangle classes each implement their own draw(), and calling draw() on any shape object renders the correct shape without the caller knowing which class it is. This is:", options: ["Encapsulation", "Inheritance", "Generalisation", "Polymorphism"], correct: 3, note: "Polymorphism lets the same method call behave appropriately depending on the object's class." },
          { q: "A SavingsAccount class reuses the balance field and deposit logic already defined in a general Account class, adding only interest-specific behaviour. This relationship is:", options: ["Polymorphism", "Inheritance", "Abstraction", "Encapsulation"], correct: 1, note: "Inheritance lets a subclass acquire and extend a parent class's attributes and methods." },
          { q: "One class hides its internal array behind add() and remove() methods so callers never touch the array directly. A separate interface elsewhere lists only which operations exist, with zero implementation detail at all. Which pairing correctly labels these two ideas, in order?", options: ["Encapsulation; abstraction", "Abstraction; encapsulation", "Inheritance; polymorphism", "Encapsulation; polymorphism"], correct: 0, note: "Hiding internal data/implementation is encapsulation; exposing only essential operations with no detail is abstraction." },
          { q: "A subclass redefines a parent class's calculateArea() method with new logic, keeping the exact same method name and parameters. This is:", options: ["Method overloading", "Method overriding", "Constructor chaining", "Interface segregation"], correct: 1, note: "Overriding replaces an inherited method's implementation while keeping its signature identical." },
          { q: "A Car class holds an Engine object as one of its fields rather than inheriting from an Engine class, because a car 'has an' engine rather than 'is an' engine. This relationship is:", options: ["Inheritance", "Composition", "Polymorphism", "Abstraction"], correct: 1, note: "Composition models a 'has-a' relationship by containing another object, distinct from inheritance's 'is-a' relationship." },
          { q: "Objects communicate by one object invoking another's exposed method and passing it data, rather than directly reaching in and manipulating the other's internal fields. This coordination mechanism is generally called:", options: ["Encapsulation", "Message-passing between objects", "Polymorphism", "Abstraction"], correct: 1, note: "OOP languages coordinate objects through message-passing — method calls — rather than direct manipulation of another object's data." },
          { q: "A designer notices Dog and Cat classes share enough common attributes and behaviour to justify factoring out a shared Animal parent class. Identifying this shared parent from common features is best described as:", options: ["Polymorphism", "Generalisation", "Encapsulation", "Message-passing"], correct: 1, note: "Generalisation is the process of identifying commonalities across classes to factor out a shared superclass, distinct from inheritance (the reuse mechanism itself)." },
          { q: "Profiling reveals a method is called millions of times and dominates a program's runtime, so a developer rewrites its internals to avoid redundant calculations without changing what it returns. This process is:", options: ["Code optimisation", "Encapsulation", "Facade design", "Regression testing"], correct: 0, note: "Code optimisation improves performance or efficiency while preserving the method's observable behaviour." },
        ],
      },
      {
        id: "design-modelling",
        title: "Design & Modelling",
        questions: [
          { q: "A MediaPlayer interface exposes only play(), pause() and stop(), hiding the codec-specific logic underneath. This is best described as:", options: ["Abstraction", "Polymorphism", "Inheritance", "Encapsulation"], correct: 0, note: "Abstraction shows only essential features while hiding implementation detail." },
          { q: "Which diagram shows that a Customer class relates to an Order class, including each class's attributes and methods?", options: ["Data flow diagram", "Structure chart", "Flowchart", "Class diagram"], correct: 3, note: "Class diagrams represent objects, their attributes/methods and relationships between classes." },
          { q: "A subsystem involves a dozen classes handling authentication, logging and caching. A new AuthService class exposes just three simple methods that internally coordinate all of it for callers. This applies the:", options: ["Observer pattern", "Singleton pattern", "Facade pattern", "Strategy pattern"], correct: 2, note: "A facade provides a simplified interface that hides a complex subsystem." },
          { q: "A UML diagram connects a Library class to a Book class with a hollow diamond at the Library end, indicating books can still exist even if the library object is destroyed. This relationship is:", options: ["Composition", "Aggregation", "Inheritance", "Dependency"], correct: 1, note: "Aggregation (hollow diamond) is a whole-part relationship where the parts can outlive the whole, unlike composition." },
          { q: "An application must guarantee exactly one instance of its configuration manager exists across the entire running program, with one global access point to it. This is the:", options: ["Observer pattern", "Factory pattern", "Singleton pattern", "Facade pattern"], correct: 2, note: "The singleton pattern restricts a class to a single shared instance." },
          { q: "Two classes are so tightly interconnected that changing one almost always forces changes in the other, even though a well-designed alternative would keep them independent. This is a case of:", options: ["High cohesion", "Low coupling", "High coupling", "Strong encapsulation"], correct: 2, note: "High coupling means classes are excessively dependent on each other's internals, hurting maintainability." },
          { q: "Before any class is designed, a team writes a clear, specific statement of exactly what the program must accomplish, kept distinct from the later structural design work. This step is:", options: ["Facade design", "Task definition", "Generalisation", "Message-passing"], correct: 1, note: "Task definition precisely scopes what a problem requires before design of classes and structure begins." },
          { q: "A diagram traces how data moves between external entities, processes and data stores across a system, without showing any class attributes or methods. This is a:", options: ["Class diagram", "Data flow diagram", "Structure chart", "Wiring diagram"], correct: 1, note: "Data flow diagrams model the movement of data through a system's processes, distinct from a class diagram's focus on object structure." },
          { q: "One team designs a system by first sketching its overall structure and progressively breaking it into smaller modules; another team first builds and tests small reusable components before assembling the whole system from them. These are respectively:", options: ["Bottom-up design; top-down design", "Top-down design; bottom-up design", "Agile; Waterfall", "Facade pattern; Singleton pattern"], correct: 1, note: "Top-down design starts from the overall structure and refines downward; bottom-up starts from components and builds upward." },
        ],
      },
      {
        id: "impl-testing",
        title: "Implementation & Testing",
        questions: [
          { q: "A tester runs the compiled program with various inputs and checks the outputs, never opening the source code. This is:", options: ["White box testing", "Static analysis", "Unit testing", "Black box testing"], correct: 3, note: "Black box testing checks functionality without knowledge of the internal implementation." },
          { q: "A tester steps through the source code line by line to confirm every branch of an if-statement executes as intended. This is:", options: ["Black box testing", "White box testing", "System testing", "Grey box testing"], correct: 1, note: "White box testing exercises internal logic and structure with knowledge of the source." },
          { q: "Three developers edit the same class at once. Which practice lets them track every change, merge edits and roll back mistakes safely?", options: ["Code commenting", "Quality assurance", "Version control", "Stub creation"], correct: 2, note: "Version control coordinates multiple developers editing the same codebase." },
          { q: "A subroutine both validates input and writes it to a database. Splitting it into two subroutines, each doing one job, follows the principle of:", options: ["Encapsulation", "Facade design", "Polymorphism", "One logical task per subroutine"], correct: 3, note: "Keeping subroutines focused on a single task improves modularity and maintainability." },
          { q: "A developer writes a failing automated test for a feature before writing any implementation code, then writes just enough code to make it pass. This practice is:", options: ["Regression testing", "Test-driven development", "Black box testing", "Static analysis"], correct: 1, note: "TDD writes the test first, then implements code to satisfy it." },
          { q: "A tester has access to the database schema and high-level architecture but not the full source code, and uses that partial knowledge to design more targeted test cases. This is:", options: ["White box testing", "Black box testing", "Grey box testing", "Unit testing"], correct: 2, note: "Grey box testing combines partial internal knowledge with external behavioural testing." },
          { q: "A function that hasn't been written yet is temporarily replaced with a simple placeholder that returns a fixed value, so the rest of the program can still be run and tested. This placeholder is a:", options: ["A watch", "A stub", "A breakpoint", "A facade"], correct: 1, note: "Stubs are placeholder implementations that let incomplete code be tested end-to-end before every part is finished." },
          { q: "Testing an individual function in isolation, then testing a group of related functions working together, then testing the entire assembled application, are three escalating levels known respectively as:", options: ["Black box, white box, grey box testing", "Unit, subsystem and system testing", "Boundary, path and regression testing", "Static, dynamic and code review testing"], correct: 1, note: "Testing scales upward from individual units, to subsystems, to the whole assembled system." },
          { q: "A team defines up front exactly what 'acceptable quality' means for a project, then continually checks the software against those criteria throughout development rather than only at the very end. This ongoing process is:", options: ["Quality assurance", "Grey box testing", "Version control", "Facade design"], correct: 0, note: "Quality assurance is an ongoing process of defining and checking against quality criteria throughout a project, not a one-off final step." },
        ],
      },
      {
        id: "design-patterns",
        title: "Design Patterns & SOLID",
        questions: [
          { q: "A class is designed so new payment methods can be added as new subclasses without ever modifying the existing payment-processing code. This reflects the:", options: ["Single responsibility principle", "Open/closed principle", "Liskov substitution principle", "Interface segregation principle"], correct: 1, note: "The open/closed principle says classes should be open for extension but closed for modification." },
          { q: "A Bird base class defines a fly() method, but a Penguin subclass inherits it despite penguins being unable to fly, forcing an awkward, incorrect override. This most directly violates the:", options: ["Open/closed principle", "Liskov substitution principle", "Dependency inversion principle", "Single responsibility principle"], correct: 1, note: "Liskov substitution requires subclasses to be usable wherever their parent type is expected, without breaking behaviour." },
          { q: "A class named ReportManager currently formats reports, saves them to disk, and emails them to clients all in one place. Splitting these into three focused classes would satisfy the:", options: ["Liskov substitution principle", "Single responsibility principle", "Interface segregation principle", "Open/closed principle"], correct: 1, note: "Single responsibility says a class should have only one reason to change." },
          { q: "A weather station object automatically notifies multiple registered display objects whenever its temperature reading changes, without knowing their concrete types in advance. This is the:", options: ["Strategy pattern", "Observer pattern", "Singleton pattern", "Factory pattern"], correct: 1, note: "The observer pattern lets subscribed objects be notified automatically of state changes in another object." },
          { q: "Client code calls a single createShape(type) function to obtain the appropriate Circle, Square or Triangle object, without ever calling their constructors directly. This is the:", options: ["Observer pattern", "Facade pattern", "Factory pattern", "Singleton pattern"], correct: 2, note: "A factory centralises and hides the logic for creating related objects." },
          { q: "A navigation app swaps between fastest-route, shortest-route and scenic-route algorithms at runtime, all implementing a common interface interchangeably. This is the:", options: ["Strategy pattern", "Singleton pattern", "Facade pattern", "Observer pattern"], correct: 0, note: "The strategy pattern lets interchangeable algorithms be swapped behind a shared interface at runtime." },
          { q: "An old class exposes a getTemperatureF() method returning Fahrenheit, but new code expects a getCelsius() method. A wrapper class implementing the expected interface is introduced, internally calling the old method and converting the result. This is the:", options: ["Observer pattern", "Adapter pattern", "Singleton pattern", "Facade pattern"], correct: 1, note: "An adapter converts one interface into another expected by the client, without modifying the original class." },
          { q: "Rather than creating a new subclass for every possible combination of coffee add-ons, a design wraps a base Coffee object in layers of add-on objects at runtime, each adding cost and description dynamically. This is the:", options: ["Decorator pattern", "Strategy pattern", "Factory pattern", "Observer pattern"], correct: 0, note: "The decorator pattern adds responsibilities to objects dynamically by wrapping them, avoiding a combinatorial explosion of subclasses." },
          { q: "A team designing OOP classes deliberately keeps early designs loosely defined, expecting them to be refined across several short iterations as understanding improves, rather than fully fixing the class hierarchy upfront. This reflects the design-process concept of:", options: ["Facade pattern", "Agility in the design process", "The Liskov substitution principle", "Message-passing"], correct: 1, note: "Agility means a design evolves iteratively rather than being fully fixed before development starts." },
        ],
      },
    ],
  },
  {
    id: "mecha",
    year: 11,
    title: "Programming Mechatronics",
    file: "mechatronics.ino",
    accent: "#ffa657",
    icon: Cpu,
    blurb: "Sensors, actuators & control systems.",
    nodes: [
      {
        id: "hardware",
        title: "Hardware Foundations",
        questions: [
          { q: "A robotic arm's motor turns an electrical control signal into physical rotation of a joint. This motor is functioning as a(n):", options: ["Sensor", "End effector", "Actuator", "Opcode"], correct: 2, note: "Actuators convert control signals into physical movement or action." },
          { q: "A robotic arm rotates independently at the shoulder, elbow and wrist. The number of independent movement axes is its:", options: ["Instruction set", "Opcode count", "Degrees of freedom", "Register width"], correct: 2, note: "Degrees of freedom describe the independent ways a system can move." },
          { q: "The lowest-level instruction a microcontroller's CPU actually executes, such as 'add' or 'move', is a(n):", options: ["Sensor signal", "Register", "Actuator command", "Opcode"], correct: 3, note: "Opcodes are the instruction codes that make up a processor's instruction set." },
          { q: "A thermostat's temperature probe feeds a reading to a controller, which then switches on a heating element. Which of these correctly matches the probe and the heating element to sensor/actuator, in order?", options: ["Probe = actuator, heating element = sensor", "Probe = sensor, heating element = actuator", "Both are sensors", "Both are actuators"], correct: 1, note: "The probe measures a condition (sensor); the heating element produces a physical effect (actuator)." },
          { q: "A light sensor outputs a continuously varying voltage proportional to brightness, rather than a simple on/off value. This output is:", options: ["Digital", "Analog", "Binary", "Opcode-based"], correct: 1, note: "Analog signals vary continuously, unlike digital signals which take discrete values." },
          { q: "A single low-cost chip embedded in a washing machine already includes a CPU, RAM, ROM and I/O pins on the one chip, needing no external memory to run its control program. This is best described as a:", options: ["Microprocessor", "Microcontroller", "Register", "Actuator"], correct: 1, note: "Microcontrollers integrate CPU, memory and I/O on a single chip for embedded control tasks." },
          { q: "A CPU temporarily holds the memory location it needs to read or write next in one dedicated internal storage location, and holds the actual value being processed in another. These two are respectively the:", options: ["Data register; address register", "Address register; data register", "Opcode; actuator", "Sensor; end effector"], correct: 1, note: "Address registers hold locations to be accessed; data registers hold the actual values being processed." },
          { q: "A processor's available instruction set directly limits how a compiler can translate high-level code for it, since every operation must ultimately map to one of its supported opcodes. This shows that:", options: ["Instruction sets have no impact on code development", "The instruction set influences how code must be compiled and developed for that processor", "Opcodes are only relevant to mechatronic systems", "Registers make opcodes unnecessary"], correct: 1, note: "A CPU's instruction set constrains what operations are directly available, shaping how code is generated for it." },
          { q: "A microcontroller integrates CPU, memory and I/O on one chip specifically to run a single embedded control program efficiently, whereas a general-purpose CPU relies on separate, upgradable components to run many different programs. This relationship best explains why microcontrollers are chosen for:", options: ["Desktop operating systems", "Dedicated, embedded control tasks", "General-purpose web servers", "Large-scale databases"], correct: 1, note: "The tight CPU-memory-I/O integration of a microcontroller suits dedicated embedded control rather than general-purpose computing." },
        ],
      },
      {
        id: "control",
        title: "Control Systems",
        questions: [
          { q: "A conveyor's speed is continuously measured and adjusted to match a target using live sensor feedback. This is a:", options: ["Open loop control system", "Static control system", "Closed loop control system", "Manual control system"], correct: 2, note: "Closed-loop systems use feedback to adjust their own behaviour." },
          { q: "A sprinkler timer runs for exactly 10 minutes at 6am regardless of how wet the soil actually is. This is a(n):", options: ["Closed loop control system", "Open loop control system", "Adaptive control system", "Reinforcement system"], correct: 1, note: "Open-loop systems run a fixed sequence without checking output against a target." },
          { q: "Which sensor type would best detect that a stationary delivery robot has just started moving?", options: ["Light level sensor", "Motion sensor", "Hydraulic actuator", "Robotic gripper"], correct: 1, note: "Motion sensors detect movement or changes in position/velocity." },
          { q: "The gripper at the end of a robotic arm that physically picks up an object is best classified as a(n):", options: ["Actuator only", "Register", "End effector / manipulator", "Sensor"], correct: 2, note: "End effectors are the parts of a robot that interact directly with the environment." },
          { q: "A closed-loop drone stabilisation system measures its tilt every millisecond and continuously adjusts motor speed to counteract drift, rather than applying one fixed correction and stopping. This ongoing correction process is best described as:", options: ["Open-loop control", "A single feedback check", "Continuous feedback control", "Static control"], correct: 2, note: "Closed-loop systems repeatedly sample and correct, rather than correcting once." },
          { q: "A closed-loop system's sensor is damaged and always reports zero, so the system continuously over-corrects based on false feedback. This exposes a key risk of closed-loop systems:", options: ["They cannot use actuators", "They depend on a power supply", "Faulty sensor data can degrade control quality", "They are inherently slower than open-loop systems"], correct: 2, note: "Closed-loop control quality depends entirely on accurate feedback; a faulty sensor can make control worse than open-loop." },
          { q: "A robotic arm's software prevents a joint from rotating past 120° even when commanded to, protecting the mechanism from physical damage. This restriction is an example of a:", options: ["Degree of freedom", "Motion constraint", "Closed-loop system", "End effector"], correct: 1, note: "Motion constraints limit valid ranges of movement to protect hardware and keep operation safe." },
          { q: "A self-driving delivery robot combines its navigation subsystem, obstacle-detection subsystem and motor-control subsystem so they work together without a human directing each step. Code enabling this level of independent operation is best described as supporting:", options: ["Manual override only", "Autonomous control", "Static analysis", "A single sensor reading"], correct: 1, note: "Autonomous control integrates multiple subsystems so a system can operate and make decisions without constant human input." },
          { q: "Combining a light sensor, a motorised wheel and a simple decision rule ('turn toward the brighter side') creates a self-contained line-following capability. This combination of sensor, actuator and control logic into one working unit is best described as a:", options: ["Data dictionary", "Viable subsystem", "Register", "Facade pattern"], correct: 1, note: "Combining sensors, actuators and end effectors into a coordinated working unit forms a viable subsystem." },
        ],
      },
      {
        id: "build-test",
        title: "Build & Test",
        questions: [
          { q: "Before deploying a new gripping algorithm to real hardware, a team runs it against a virtual model of the arm. This is best described as:", options: ["Skipping the design phase", "Wiring diagram creation", "Building a simulation/prototype to test code safely", "Unit testing only"], correct: 2, note: "Simulations and prototypes let teams validate control code before risking real hardware." },
          { q: "When designing a wiring diagram for a mechatronic system, which two factors must be balanced across every component?", options: ["Colour and brand", "Cost and marketing", "Power supply and data requirements", "Font and label size"], correct: 2, note: "Wiring diagrams must account for how power and data reach each component." },
          { q: "A team writes automated tests that repeatedly run a single motor-control routine to confirm it produces the same movement every time. This checks the routine's:", options: ["Aesthetic design", "Power consumption only", "Reliability and repeatability", "Marketing viability"], correct: 2, note: "Unit tests confirm a component behaves consistently on repeated runs." },
          { q: "After a simulation reveals the gripper motor stalls under load, the team revises both the control algorithm and the gearing before re-testing in simulation again. This iterative refinement is most consistent with:", options: ["Waterfall's strict linear sequence", "Direct implementation", "An iterative development approach", "Skipping the testing stage entirely"], correct: 2, note: "Repeated cycles of testing and refinement reflect an iterative, rather than strictly linear, process." },
          { q: "Before relying on a distance sensor's readings, a team compares its output against known measured distances and adjusts its formula to correct a consistent offset. This process is:", options: ["Calibration", "Compilation", "Encapsulation", "Sandboxing"], correct: 0, note: "Calibration aligns a sensor's raw output with known reference values." },
          { q: "A robotic arm is programmed to immediately stop and hold position if it loses sensor signal, rather than continuing to move blindly. This design choice is an example of:", options: ["Open-loop control", "A fail-safe / safety mechanism", "Backtracking", "Object-oriented design"], correct: 1, note: "Fail-safe design ensures a system defaults to a safe state when something goes wrong." },
          { q: "Designing a mechatronic harvesting robot requires combining knowledge of motor torque and gearing, circuit design, and trajectory calculations alongside the control software itself. This reflects that mechatronics projects are inherently:", options: ["Purely a software discipline", "Multidisciplinary, spanning software, mechanical engineering and electronics/mathematics", "Only relevant to Year 12 study", "Unrelated to control algorithms"], correct: 1, note: "Mechatronics integrates software control with mechanical engineering, electronics and mathematics." },
          { q: "A technician builds a simple on-screen dashboard with sliders and buttons so an operator can manually jog a robotic arm's joints during setup. This is best described as designing a:", options: ["Wiring diagram", "User interface (UI) to control the mechatronic system", "Data dictionary", "Test plan"], correct: 1, note: "A UI lets a human operator directly control and interact with a mechatronic system's behaviour." },
          { q: "A mechatronic system designed for a person with limited hand mobility replaces small physical buttons with larger, voice-activated commands. This design choice is driven primarily by:", options: ["Reducing manufacturing cost only", "Specialist accessibility requirements for people with disability", "Increasing processor speed", "Reducing the number of sensors needed"], correct: 1, note: "Mechatronic system design must account for specialist requirements to support users with disability." },
        ],
      },
      {
        id: "interfacing",
        title: "Programming & Interfacing",
        questions: [
          { q: "A microcontroller reads a value from an analog pin and must convert it into a digital value the CPU can process numerically. This conversion is performed by a(n):", options: ["DAC (digital-to-analog converter)", "ADC (analog-to-digital converter)", "Opcode translator", "Actuator driver"], correct: 1, note: "An ADC converts a continuous analog signal into a discrete digital value." },
          { q: "Two microcontrollers exchange data one bit at a time over a shared line, taking turns to avoid collisions, using a simple low-speed protocol common between mechatronic sensors and controllers. This is most likely:", options: ["HTTP", "I2C or serial communication", "TCP/IP", "DNS"], correct: 1, note: "I2C and serial protocols are common low-level communication methods between embedded devices." },
          { q: "A control program checks a sensor's value in an infinite loop, executing the same sequence indefinitely until the device is powered off. This structure is called a(n):", options: ["One-shot procedure", "Event handler", "Main/control loop", "Recursive call"], correct: 2, note: "Embedded systems commonly run a continuous main loop that repeatedly checks state and reacts." },
          { q: "An interrupt-driven design lets a microcontroller immediately respond to a button press instead of constantly checking the button's state in a loop. The main benefit of this approach is:", options: ["It uses more power", "It responds instantly without wasting CPU cycles on constant polling", "It removes the need for sensors", "It only works with actuators"], correct: 1, note: "Interrupts let the CPU react immediately to events instead of continuously polling for them." },
          { q: "A control program stores calibration constants in memory that survives a power cycle, rather than in variables that reset every time the device restarts. This memory type is most likely:", options: ["RAM", "EEPROM/flash memory", "A register", "A cache"], correct: 1, note: "Non-volatile memory like EEPROM/flash retains data even when power is removed, unlike RAM." },
          { q: "A team is deciding how to detect a rarely-triggered emergency stop button. Which approach minimises wasted processing while still guaranteeing an instant response?", options: ["Polling the button in the main loop every cycle", "Interrupt-driven handling", "Ignoring the button until the next scheduled check", "Increasing the loop delay"], correct: 1, note: "For rare, urgent events, interrupts avoid the CPU overhead of constant polling while still reacting immediately." },
          { q: "A control program logs sensor readings purely to help engineers work out why a fault occurred, separate from the data it uses moment-to-moment to decide motor speed. These two uses of data are respectively best described as:", options: ["Optimisation data; diagnostic data", "Diagnostic data; data used for optimisation", "Opcode data; register data", "Encapsulated data; abstracted data"], correct: 1, note: "Diagnostic data supports troubleshooting after the fact; optimisation data actively tunes real-time system performance." },
          { q: "An open control system's algorithm executes a fixed sequence of motor commands with no feedback loop at all, while a closed control system's algorithm repeatedly loops: read sensor, compare to target, adjust actuator. This distinction is why closed-loop control code is generally:", options: ["Simpler and shorter than open-loop code", "More complex, incorporating a continuous feedback loop absent from open-loop code", "Impossible to implement in software", "Identical in structure to open-loop code"], correct: 1, note: "Closed-loop control algorithms require an ongoing read-compare-adjust loop that open-loop designs don't need." },
          { q: "A robotic arm has 6 independently rotating joints, giving it 6 degrees of freedom. If the control software must compute a valid combination of all 6 joint angles simultaneously to reach a target position, this computation is most directly complicated by:", options: ["The number of degrees of freedom the system must coordinate", "The colour of the wiring diagram", "The choice of IDE", "The database schema"], correct: 0, note: "More degrees of freedom increase the complexity of computing valid, coordinated joint configurations." },
        ],
      },
    ],
  },
  {
    id: "secure-arch",
    year: 12,
    title: "Secure Software Architecture",
    file: "security.conf",
    accent: "#ff7b72",
    icon: Shield,
    blurb: "CIA triad, secure coding & attack vectors.",
    nodes: [
      {
        id: "principles",
        title: "Security Principles",
        questions: [
          { q: "A system ensures data isn't viewable by unauthorised users, hasn't been tampered with, and stays accessible when needed. These three properties together are:", options: ["The SOLID principles", "ACID properties", "The CIA triad", "The OWASP top ten"], correct: 2, note: "Confidentiality, Integrity and Availability form the CIA triad of secure design." },
          { q: "A team threat-models the system and builds in access controls and encryption from the first design meeting, rather than retrofitting them before launch. This reflects:", options: ["Security by design", "Sandboxing", "Static analysis", "Privacy by design"], correct: 0, note: "Security by design builds protection in from the earliest stages, not as an afterthought." },
          { q: "By default, a new user's posts on a social app are private rather than public, with no setting change required. This default-protective approach reflects:", options: ["Security by design", "Penetration testing", "Privacy by design", "Static application security testing"], correct: 2, note: "Privacy by design proactively embeds respect for user privacy into the default behaviour." },
          { q: "A junior support staff member's account can only view customer names and order status, not billing details or admin settings — exactly matching what their role requires and nothing more. This reflects the principle of:", options: ["Security by design", "Least privilege", "Privacy by design", "Defence in depth"], correct: 1, note: "Least privilege grants accounts only the access strictly necessary for their role." },
          { q: "A system requires a firewall, encrypted storage and multi-factor login all at once, so that if one layer fails, others still protect the data. This layered approach is:", options: ["Least privilege", "Defence in depth", "Sandboxing", "Static analysis"], correct: 1, note: "Defence in depth stacks multiple independent layers of protection so no single failure is catastrophic." },
          { q: "An attacker doesn't read or alter a hospital's patient database, but floods its servers with traffic so staff cannot access records during an emergency. Which part of the CIA triad is most directly violated?", options: ["Confidentiality", "Integrity", "Availability", "Authentication"], correct: 2, note: "Denial-of-service attacks target availability by preventing legitimate access, without necessarily touching confidentiality or integrity." },
          { q: "A system correctly verifies who a user is via a password, and a separate check then determines what that specific verified user is permitted to do within the system. These two steps are respectively:", options: ["Authorisation; authentication", "Authentication; authorisation", "Confidentiality; integrity", "Availability; accountability"], correct: 1, note: "Authentication verifies identity; authorisation then determines what actions that identity is permitted to perform." },
          { q: "After a breach, forensic logs let investigators trace exactly which user account performed a specific harmful action, holding that user answerable for it. This security property is:", options: ["Availability", "Accountability", "Confidentiality", "Sandboxing"], correct: 1, note: "Accountability ensures actions within a system can be traced back to a responsible party." },
          { q: "A company patches known vulnerabilities, disables unused services and tightens default configurations across its servers ahead of an anticipated spike in attacks. This proactive process is called:", options: ["Disaster recovery", "System hardening", "Business continuity planning", "Digital signing"], correct: 1, note: "Hardening reduces a system's attack surface by removing weaknesses before they can be exploited." },
        ],
      },
      {
        id: "attack-vectors",
        title: "Attack Vectors",
        questions: [
          { q: "An attacker enters ' OR 1=1 -- into a login form's username field to manipulate the underlying database query. Which defence most directly prevents this?", options: ["SSL certificates", "Digital signatures", "Input validation and sanitisation", "Load balancing"], correct: 2, note: "Validating and sanitising input stops malicious query fragments from being executed." },
          { q: "An unfiltered comment field lets an attacker post a script that steals other visitors' session cookies when they view the page. This is:", options: ["SQL injection", "A race condition", "Cross-site scripting (XSS)", "Broken authentication"], correct: 2, note: "XSS injects malicious scripts that execute in other users' browsers." },
          { q: "A malicious webpage silently submits a hidden form to a banking site the victim is already logged into, transferring funds without their knowledge. This is:", options: ["Cross-site scripting (XSS)", "SQL injection", "Cross-site request forgery (CSRF)", "A side channel attack"], correct: 2, note: "CSRF exploits a user's authenticated session to trigger unwanted actions." },
          { q: "An attacker submits thousands of common passwords against one username within seconds until one succeeds. The most effective direct defence is:", options: ["Input sanitisation", "Account lockout / rate limiting after failed attempts", "Digital signatures", "Load balancing"], correct: 1, note: "Rate limiting or lockouts stop attackers from rapidly trying many password guesses." },
          { q: "An attacker on the same public Wi-Fi intercepts and reads unencrypted traffic between a user's laptop and a website. Which single measure most directly prevents this?", options: ["HTTPS/TLS encryption", "Input validation", "Boundary testing", "Sandboxing"], correct: 0, note: "Encrypting traffic in transit prevents eavesdroppers from reading intercepted data." },
          { q: "A form field is vulnerable both to malicious scripts being stored and shown to other users, and to malicious fragments manipulating the underlying database query, because the developer neither escaped output nor parameterised queries. Which pair of vulnerabilities is present?", options: ["CSRF and static analysis", "Cross-site scripting (XSS) and SQL injection", "DAST and sandboxing", "Two instances of CSRF"], correct: 1, note: "Unescaped output enables XSS; unsanitised query building enables SQL injection — distinct flaws with distinct fixes." },
          { q: "A session token doesn't expire after logout and can still be reused later by anyone who obtains it, letting them access the account without ever entering a password. This weakness falls under:", options: ["SQL injection", "Broken authentication and session management", "Cross-site scripting", "A side channel attack"], correct: 1, note: "Broken authentication/session management includes tokens that fail to properly expire or invalidate after logout." },
          { q: "A shopping site redirects users after checkout using an unchecked URL parameter, letting an attacker craft a link that instead redirects victims to a convincing fake payment page. This vulnerability is:", options: ["A race condition", "Invalid forwarding and redirecting", "A side channel attack", "SQL injection"], correct: 1, note: "Unvalidated redirect targets can be abused to send users to an attacker-controlled destination." },
          { q: "Two threads both check that an account's balance is sufficient and then both proceed to withdraw funds simultaneously, before either update is saved — resulting in more money being withdrawn than the balance allowed. This flaw is a:", options: ["Race condition", "Cross-site scripting attack", "Digital signature failure", "DNS spoofing attack"], correct: 0, note: "Race conditions occur when concurrent operations interleave in ways that violate the intended check-then-act logic." },
        ],
      },
      {
        id: "testing-containment",
        title: "Testing & Containment",
        questions: [
          { q: "A security firm actively attempts to break into a client's system exactly as a real attacker would, to uncover exploitable weaknesses. This is:", options: ["Static application security testing", "Code review", "Penetration testing", "Vulnerability disclosure"], correct: 2, note: "Penetration testing simulates a real attack to find vulnerabilities." },
          { q: "A tool scans an application's source code for known insecure patterns without ever running the program. This is:", options: ["DAST", "SAST", "Penetration testing", "Sandboxing"], correct: 1, note: "SAST analyses source code without executing it." },
          { q: "A tool sends crafted requests to a live, running web application to see how it behaves, without access to its source code. This is:", options: ["SAST", "Static analysis", "DAST", "Code review"], correct: 2, note: "DAST tests a running application from the outside." },
          { q: "A browser runs untrusted third-party plugin code inside a restricted environment so that, even if malicious, it can't affect the rest of the system. This is:", options: ["Sandboxing", "Cryptography", "Load balancing", "Static analysis"], correct: 0, note: "Sandboxing isolates code to contain potential damage." },
          { q: "A researcher privately reports a discovered flaw to a vendor and agrees to withhold public details until a fix is released. This process is:", options: ["Penetration testing", "Responsible/coordinated vulnerability disclosure", "Static analysis", "DAST"], correct: 1, note: "Responsible disclosure gives vendors time to patch before details go public." },
          { q: "A team wants to catch a hardcoded API key committed directly into the source code before the application is ever run. Which testing approach would catch this?", options: ["DAST", "Penetration testing only", "SAST", "Sandboxing"], correct: 2, note: "SAST inspects source code directly, so it can flag hardcoded secrets without executing the program." },
          { q: "A team systematically scans its systems to catalogue and rate all known weaknesses by severity, without actually attempting to exploit any of them. This activity is:", options: ["Penetration testing", "Vulnerability assessment", "Code review", "Sandboxing"], correct: 1, note: "Vulnerability assessment identifies and rates weaknesses without actively exploiting them, unlike penetration testing." },
          { q: "A senior developer reads through a colleague's newly written authentication code line by line, looking for insecure patterns before it's merged. This manual practice is:", options: ["Code review", "DAST", "Penetration testing", "Fuzzing"], correct: 0, note: "Code review is a manual human inspection of source code for issues, including security flaws." },
          { q: "After a ransomware attack encrypts production servers, an organisation switches operations to an offsite backup system within minutes to keep serving customers, then later restores and rebuilds the affected servers. These two responses are respectively examples of:", options: ["Business continuity; disaster recovery", "Disaster recovery; business continuity", "Sandboxing; penetration testing", "SAST; DAST"], correct: 0, note: "Business continuity keeps critical operations running during a disruption; disaster recovery restores full normal operation afterward." },
        ],
      },
      {
        id: "crypto-auth",
        title: "Cryptography & Authentication",
        questions: [
          { q: "A message is scrambled using a key so that only someone with the matching key can read it, and the same key both scrambles and unscrambles it. This is:", options: ["Asymmetric encryption", "Symmetric encryption", "Hashing", "Digital signing"], correct: 1, note: "Symmetric encryption uses one shared key for both encryption and decryption." },
          { q: "A website stores a one-way transformation of a user's password so that even if the database leaks, the original password can't be directly recovered from it. This technique is:", options: ["Symmetric encryption", "Hashing", "Asymmetric encryption", "Base64 encoding"], correct: 1, note: "Hashing is a one-way function well suited to storing passwords irreversibly." },
          { q: "A user encrypts a message using the recipient's publicly published key, and only the recipient's separately held private key can decrypt it. This is:", options: ["Symmetric encryption", "Hashing", "Asymmetric/public-key encryption", "Salting"], correct: 2, note: "Asymmetric encryption uses a mathematically linked key pair — public to encrypt, private to decrypt." },
          { q: "Two accounts share the exact same password, and because the system hashes passwords without adding any unique random value beforehand, their stored hashes end up identical — letting an attacker who cracks one instantly crack both. Adding a unique random value per password before hashing to prevent this is called:", options: ["Salting", "Encryption", "Tokenisation", "Firewalling"], correct: 0, note: "Salting adds unique random data to each password before hashing so identical passwords produce different hashes." },
          { q: "Logging in requires both a correct password and a one-time code sent to the user's phone. This is:", options: ["Single-factor authentication", "Multi-factor authentication", "Biometric authentication only", "Role-based access control"], correct: 1, note: "MFA combines two or more independent proof factors, such as something you know and something you have." },
          { q: "A system grants permissions based on whether a user is assigned 'admin', 'editor' or 'viewer', rather than configuring access individually for every single user. This is:", options: ["Multi-factor authentication", "Role-based access control", "Symmetric encryption", "Digital signing"], correct: 1, note: "RBAC assigns permissions to roles, which are then assigned to users, simplifying access management." },
          { q: "A file's hash value changes completely if even a single byte of the file is altered, letting a recipient detect tampering by recomputing and comparing the hash. This property — that tiny input changes cause large, unpredictable output changes — is called the:", options: ["Avalanche effect", "Salting effect", "Two's complement effect", "CIA effect"], correct: 0, note: "Cryptographic hash functions are designed so a small input change produces a drastically different output hash." },
          { q: "A certificate authority issues a signed certificate binding a website's public key to its verified domain identity, which browsers check before establishing an encrypted HTTPS connection. This certificate is a(n):", options: ["Hash value", "SSL/TLS certificate", "Cookie", "Salt"], correct: 1, note: "SSL/TLS certificates bind a public key to a verified identity, issued and signed by a trusted certificate authority." },
          { q: "Readable original data before encryption is called plain text. Once scrambled by an encryption algorithm and key, it becomes:", options: ["Hash text", "Cipher text", "Salted text", "Signed text"], correct: 1, note: "Cipher text is the scrambled output produced by encrypting plain text." },
        ],
      },
    ],
  },
  {
    id: "web",
    year: 12,
    title: "Programming for the Web",
    file: "webapp.js",
    accent: "#d2a8ff",
    icon: Globe,
    blurb: "Protocols, front/back-end & databases.",
    nodes: [
      {
        id: "protocols",
        title: "Protocols & Transport",
        questions: [
          { q: "A user types a site name into their browser, and before it can connect, that name must be translated into a numeric address. Which system performs this?", options: ["TCP/IP", "SSL/TLS", "DNS", "HTTP"], correct: 2, note: "DNS translates domain names into IP addresses." },
          { q: "A banking site shows a padlock icon and encrypts all traffic between browser and server using TLS. Which protocol is responsible?", options: ["HTTP", "FTP", "SMTP", "HTTPS"], correct: 3, note: "HTTPS wraps HTTP traffic in SSL/TLS encryption." },
          { q: "Which protocol suite defines how data is broken into packets, addressed and routed across the internet, regardless of the application using it?", options: ["CSS", "ORM", "TCP/IP", "DNS"], correct: 2, note: "TCP/IP governs how data moves across networks." },
          { q: "A live video call app tolerates occasional dropped frames but cannot tolerate the lag caused by waiting for retransmitted packets, so it favours speed over guaranteed delivery. Which transport protocol best fits this trade-off?", options: ["TCP", "UDP", "HTTP", "FTP"], correct: 1, note: "UDP sacrifices guaranteed, ordered delivery for lower latency, suiting real-time media." },
          { q: "A web server distinguishes HTTPS traffic from plain HTTP traffic on the same machine because each protocol is conventionally associated with a different default:", options: ["IP address", "Port number", "DNS record", "MAC address"], correct: 1, note: "HTTP and HTTPS use different default ports (80 and 443) to route traffic to the right service." },
          { q: "A browser sends a GET request and the server responds with a status code before any HTML is rendered. A code of 404 in that response means:", options: ["The request succeeded and content follows", "The server encountered an internal error", "The requested resource was not found", "The request was redirected"], correct: 2, note: "HTTP 404 specifically indicates the requested resource could not be found on the server." },
          { q: "A user downloads a file from a remote server using a protocol that encrypts the transfer, protecting credentials and file contents from eavesdroppers, unlike its older unencrypted counterpart. These two protocols are respectively:", options: ["FTP; SFTP", "SFTP; FTP", "HTTP; HTTPS", "DNS; TCP/IP"], correct: 1, note: "SFTP adds encryption over the older, unencrypted FTP protocol for file transfer." },
          { q: "One email protocol downloads messages from a mail server and removes them from the server once retrieved, while another keeps messages synced across multiple devices by leaving them on the server. These are respectively:", options: ["IMAP; POP3", "POP3; IMAP", "SMTP; POP3", "FTP; SMTP"], correct: 1, note: "POP3 typically downloads and removes mail from the server; IMAP keeps mail synchronised on the server across devices." },
          { q: "Before transmission, a large file is broken into smaller, individually addressed chunks that may travel different routes across the internet and are reassembled at the destination. These chunks are:", options: ["Opcodes", "Data packets", "Registers", "Cookies"], correct: 1, note: "Data is broken into packets for transmission, each routed independently and reassembled on arrival." },
        ],
      },
      {
        id: "front-back",
        title: "Front-End & Back-End",
        questions: [
          { q: "JavaScript running inside a user's browser to validate a form before it's submitted is an example of:", options: ["Server-side/back-end development", "Client-side/front-end development", "Database administration", "DNS resolution"], correct: 1, note: "Front-end code executes in the browser to render and drive the interface." },
          { q: "Code running on a remote machine that queries a SQL database and returns results to the browser is best described as:", options: ["Client-side/front-end development", "A CSS stylesheet", "Server-side/back-end development", "A DNS lookup"], correct: 2, note: "Back-end code handles processing, logic and database access on the server." },
          { q: "Which technology ensures a site's layout and fonts render consistently whether viewed on a phone or a desktop monitor?", options: ["SQL", "TCP/IP", "CSS", "ORM"], correct: 2, note: "CSS provides consistent styling across browsers and devices." },
          { q: "A news site works with no internet connection, can be pinned to a phone's home screen, and sends push notifications like a native app. This is a:", options: ["Content management system", "Static HTML site", "Progressive web app", "Web framework"], correct: 2, note: "PWAs combine web reach with native-app-like features such as offline access." },
          { q: "A single-page app fetches new data from the server in the background and updates part of the page, without a full page reload. This relies on:", options: ["A Gantt chart", "Asynchronous JavaScript requests (AJAX/fetch) to an API", "CSS media queries", "DNS caching"], correct: 1, note: "Background asynchronous requests let pages update partially without a full reload." },
          { q: "A layout uses fixed pixel widths for every element, so on a narrow phone screen content overflows and forces horizontal scrolling. Using relative units and breakpoints that adapt to screen size instead is called:", options: ["Server-side rendering", "Responsive web design", "Progressive enhancement of back-end code", "DNS resolution"], correct: 1, note: "Responsive design adapts layout to different screen sizes using relative units and breakpoints." },
          { q: "A front-end library provides ready-made CSS classes, such as .btn-primary, that developers apply directly to HTML elements for consistent styling without writing custom CSS rules. This is best described as using:", options: ["A JavaScript framework", "Predesigned CSS classes from a library", "A template engine", "A back-end ORM"], correct: 1, note: "Predesigned CSS class libraries offer reusable styling without writing bespoke rules." },
          { q: "A tool inserts dynamic values into HTML by processing placeholders like {{ username }} directly inside markup templates on the server, before sending the finished page to the browser. This tool is a:", options: ["Template engine", "Content delivery network", "DNS resolver", "Cascading style sheet"], correct: 0, note: "Template engines merge dynamic data into HTML templates, typically server-side, before the page reaches the client." },
          { q: "A site provides alternative text for images, keyboard-navigable menus, and sufficient colour contrast so users with visual or motor impairments can use it effectively. These practices are guided by the W3C's:", options: ["Web Accessibility Initiative (WAI)", "Domain Name System (DNS)", "Object-Relational Mapping (ORM)", "Content Management System (CMS)"], correct: 0, note: "The WAI develops guidelines for making web content accessible to people with disabilities." },
        ],
      },
      {
        id: "data-trust",
        title: "Data & Trust",
        questions: [
          { q: "A query needs to count how many orders each customer placed, collapsing multiple order rows into one row per customer. Which SQL clause achieves this?", options: ["WHERE", "ORDER BY", "JOIN", "GROUP BY"], correct: 3, note: "GROUP BY aggregates rows that share a common value." },
          { q: "A framework lets developers write customer.save() instead of hand-writing INSERT/UPDATE statements, automatically translating objects to database rows. This is:", options: ["A content management system", "A template engine", "Object-Relational Mapping (ORM)", "A web protocol"], correct: 2, note: "ORM maps database tables to programming objects." },
          { q: "A downloaded update includes a signature letting the OS confirm it came from the claimed developer and wasn't altered in transit. This is a:", options: ["SSL certificate only", "DNS record", "Cookie", "Digital signature"], correct: 3, note: "Digital signatures verify authenticity and integrity of data." },
          { q: "A single Orders table repeats a customer's full name, address and phone number in every row for every order they've ever placed, wasting space and risking inconsistency if their address changes. Splitting customer details into a separate linked table is an example of:", options: ["Denormalisation", "Database normalisation", "ORM mapping", "Data dictionary creation"], correct: 1, note: "Normalisation removes redundant repeated data by splitting it into related tables." },
          { q: "A query needs to list every order together with the name of the customer who placed it, where order and customer details live in two separate tables linked by a shared customer ID. Which clause combines rows across both tables based on that key?", options: ["GROUP BY", "WHERE only", "JOIN", "ORDER BY"], correct: 2, note: "JOIN combines rows from related tables based on a shared key." },
          { q: "A shopping site remembers items in a cart as a user browses between pages, using a small piece of data stored in the user's browser and sent with every request. This is a:", options: ["Digital signature", "Cookie", "Data dictionary entry", "DNS record"], correct: 1, note: "Cookies store small pieces of state in the browser, sent with subsequent requests to the same site." },
          { q: "A developer writes `SELECT * FROM orders WHERE total > 100;` directly, while a colleague instead calls `Order.where(total_gt: 100)` in their programming language, which is automatically translated into equivalent SQL behind the scenes. These two approaches respectively represent:", options: ["ORM; raw SQL", "Raw SQL; ORM", "Front-end; back-end", "DNS; TCP/IP"], correct: 1, note: "Raw SQL is written directly; ORM lets code express queries in the host language, translated to SQL automatically." },
          { q: "A streaming platform analyses viewing history across millions of users to uncover non-obvious patterns, such as which unrelated genres tend to be watched together. This large-scale pattern discovery process is:", options: ["Data mining", "A data dictionary", "ORM mapping", "A digital signature"], correct: 0, note: "Data mining discovers hidden patterns and relationships within large datasets." },
          { q: "A photo file itself is the picture data, while separate information recording when and where it was taken, and with what camera, travels alongside it. This separate descriptive information is:", options: ["Metadata", "Cipher text", "A cookie", "A hash value"], correct: 0, note: "Metadata is data describing other data, such as a file's origin, format or context." },
        ],
      },
      {
        id: "architecture-perf",
        title: "Web Architecture & Performance",
        questions: [
          { q: "A popular site places identical copies of its static content on servers in multiple countries, so users are served from the nearest one. This infrastructure is a:", options: ["Load balancer only", "Content delivery network (CDN)", "DNS server", "ORM layer"], correct: 1, note: "CDNs distribute copies of content geographically to reduce latency for distant users." },
          { q: "A single web server receiving too many simultaneous requests starts timing out, so traffic is automatically spread across several identical servers behind one address. This technique is:", options: ["Load balancing", "Normalisation", "Caching", "Sandboxing"], correct: 0, note: "Load balancing distributes incoming traffic across multiple servers to prevent overload." },
          { q: "A page temporarily stores a rendered copy of expensive database query results, so that repeated identical requests don't re-run the full query each time. This technique is:", options: ["Load balancing", "Caching", "CDN routing", "Normalisation"], correct: 1, note: "Caching stores results of expensive operations for reuse, avoiding repeated computation." },
          { q: "A three-tier web architecture separates an application into presentation, application logic and data layers. Which best describes the purpose of separating these tiers?", options: ["To make deployment slower but more secure", "To allow each layer to be developed, scaled and maintained independently", "To remove the need for a database entirely", "To force all logic into the front-end"], correct: 1, note: "Layered architecture lets each tier be built, scaled and changed with minimal impact on the others." },
          { q: "A REST API returns a 500 status code when a client sends a perfectly valid request. This status code range indicates:", options: ["A successful response", "A client-side error", "A server-side error", "A redirection"], correct: 2, note: "5xx status codes indicate the server failed to fulfil a valid request." },
          { q: "A site's homepage loads slowly because a huge, unoptimised image downloads in full before anything else renders. Which technique best addresses this specific problem?", options: ["Adding more database indexes", "Image compression and lazy loading", "Switching from HTTPS to HTTP", "Increasing DNS TTL"], correct: 1, note: "Compressing images and deferring their load until needed directly reduces initial page load time." },
          { q: "A news organisation lets non-technical staff publish and edit articles through a web interface, without needing to write any HTML or touch the underlying code. This platform is a:", options: ["Content management system (CMS)", "Content delivery network (CDN)", "ORM", "Template engine only"], correct: 0, note: "A CMS lets non-technical users manage web content through an interface that abstracts away raw code." },
          { q: "A video service must continuously manage which servers handle live streams, adapt video quality to each viewer's bandwidth, and gracefully handle sudden spikes in concurrent viewers during a popular event. Collectively, this is best described as:", options: ["Streaming service management", "Static analysis", "ORM mapping", "SAST"], correct: 0, note: "Streaming service management covers the operational challenges of delivering live and on-demand video at scale." },
          { q: "A DNS record is cached by a user's browser for a set period (its time-to-live), so repeated visits to the same domain skip a fresh DNS lookup. Shortening this period would most directly:", options: ["Increase how quickly DNS changes propagate, at the cost of more frequent lookups", "Eliminate the need for HTTPS", "Prevent any caching from ever occurring", "Guarantee zero latency for all users"], correct: 0, note: "A shorter DNS TTL means changes propagate faster but requires more frequent re-resolution, trading off caching efficiency." },
        ],
      },
    ],
  },
  {
    id: "automation",
    year: 12,
    title: "Software Automation",
    file: "model.ml",
    accent: "#f2cc60",
    icon: Bot,
    blurb: "Machine learning models & algorithms.",
    nodes: [
      {
        id: "learning-models",
        title: "Learning Models",
        questions: [
          { q: "A model is trained on thousands of emails already tagged 'spam' or 'not spam' so it learns to classify new ones the same way. This is:", options: ["Unsupervised learning", "Reinforcement learning", "Supervised learning", "Semi-supervised learning"], correct: 2, note: "Supervised learning trains on labelled data mapping inputs to known outputs." },
          { q: "A retailer feeds years of unlabelled purchase data into an algorithm to discover natural customer groupings it didn't define in advance. This is:", options: ["Supervised learning", "Reinforcement learning", "Logistic regression", "Unsupervised learning"], correct: 3, note: "Unsupervised learning finds patterns or structure in unlabelled data." },
          { q: "A game-playing agent tries different moves, earning points for wins and losing points for mistakes, gradually improving over many matches. This is:", options: ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "Linear regression"], correct: 2, note: "Reinforcement learning trains an agent through rewards and penalties for its actions." },
          { q: "A dataset has 100,000 images but only 500 are manually labelled. A model is trained on the labelled subset and then used to help label the rest, combining both. This blended approach is:", options: ["Supervised learning", "Unsupervised learning", "Semi-supervised learning", "Reinforcement learning"], correct: 2, note: "Semi-supervised learning combines a small labelled set with a larger unlabelled one." },
          { q: "A model achieves 99% accuracy on its training data but only 60% on new, unseen data, having effectively memorised noise specific to the training set. This is:", options: ["Underfitting", "Overfitting", "Bias", "Regression"], correct: 1, note: "Overfitting occurs when a model learns training-specific noise rather than generalisable patterns." },
          { q: "A team holds back a portion of labelled data that the model never sees during training, using it only afterward to check how well the model generalises. This held-back portion is the:", options: ["Training set", "Test/validation set", "Feature set", "Label set"], correct: 1, note: "A test/validation set evaluates generalisation on data the model hasn't trained on." },
          { q: "A software pipeline automatically builds, tests and deploys new code the moment it's committed, without a human manually triggering each step. This automation of the software delivery process itself is best described as:", options: ["Robotic process automation (RPA)", "DevOps automation", "Business process automation (BPA)", "Reinforcement learning"], correct: 1, note: "DevOps automation focuses on automating the software build, test and deploy pipeline." },
          { q: "A bot logs into a company's invoicing website, copies data into a spreadsheet, and submits it to another system every night — mimicking exactly the repetitive clicks a human would perform, with no learning involved. This is:", options: ["Robotic process automation (RPA)", "Reinforcement learning", "Unsupervised learning", "A neural network"], correct: 0, note: "RPA automates repetitive, rule-based digital tasks by mimicking user actions, without necessarily learning from data." },
          { q: "An insurer's end-to-end claims process — intake, document checks, approval routing and payment — is redesigned so software handles the entire workflow with minimal manual handoffs between departments. This broader automation of a business workflow is:", options: ["Business process automation (BPA)", "Robotic process automation (RPA) only", "Supervised learning", "K-nearest neighbour"], correct: 0, note: "BPA automates and streamlines an entire business workflow, broader in scope than a single RPA bot." },
        ],
      },
      {
        id: "algorithms",
        title: "Algorithms",
        questions: [
          { q: "A model predicts a house's exact sale price — a continuous number — from its size and location. Which algorithm best fits?", options: ["Logistic regression", "K-nearest neighbour classification", "Linear regression", "A classification decision tree"], correct: 2, note: "Linear regression models a continuous numeric output." },
          { q: "A model predicts whether a transaction is 'fraudulent' or 'not', a yes/no outcome. Which algorithm is purpose-built for this?", options: ["Linear regression", "Logistic regression", "K-nearest neighbour only", "A neural network only"], correct: 1, note: "Logistic regression estimates the probability of a categorical outcome." },
          { q: "A flowchart-like model repeatedly splits data by asking yes/no questions about its features until it reaches a classification. This is a:", options: ["Neural network", "Linear regression model", "Decision tree", "Reinforcement agent"], correct: 2, note: "Decision trees branch through a series of decisions based on feature values." },
          { q: "To classify a new point, an algorithm looks at the five most similar existing labelled points and assigns the majority label among them. This is:", options: ["Linear regression", "Logistic regression", "Decision tree", "K-nearest neighbour"], correct: 3, note: "KNN classifies based on the closest labelled examples." },
          { q: "An algorithm groups unlabelled customers into clusters by repeatedly assigning each point to its nearest of k centre points, then recalculating those centres. This is:", options: ["K-nearest neighbour", "K-means clustering", "Logistic regression", "Decision tree"], correct: 1, note: "K-means iteratively assigns points to the nearest centroid and updates centroids, an unsupervised clustering method." },
          { q: "A single, very deep decision tree perfectly classifies all training data but performs poorly on new data, while limiting its depth slightly reduces training accuracy but improves generalisation. This trade-off illustrates:", options: ["The bias-variance trade-off between overfitting and generalisation", "A syntax error in the tree", "Reinforcement learning reward shaping", "Data dictionary design"], correct: 0, note: "Deeper trees fit training data more closely (low bias, high variance) at the risk of poor generalisation." },
          { q: "A dataset shows that as advertising spend increases, sales rise sharply at first then level off — a curved rather than straight-line relationship. Fitting a model that includes squared and cubed terms of the input to capture this curve is:", options: ["Linear regression", "Polynomial regression", "Logistic regression", "K-nearest neighbour"], correct: 1, note: "Polynomial regression extends linear regression with higher-order terms to fit curved relationships." },
          { q: "A model must predict whether a tumour is malignant — a strictly yes/no outcome. Which of linear regression, polynomial regression and logistic regression is purpose-built for this?", options: ["Linear regression", "Polynomial regression", "Logistic regression", "None of these fit categorical outcomes"], correct: 2, note: "Logistic regression is designed specifically for binary/categorical outcomes, unlike linear or polynomial regression, which predict continuous values." },
          { q: "A decision tree used for fault diagnosis and a neural network used for image recognition are both models for designing and analysing ML. Which key difference distinguishes them?", options: ["Decision trees branch through explicit yes/no rules; neural networks learn weighted connections across layers", "Neural networks cannot be used for classification", "Decision trees require GPUs while neural networks do not", "They are functionally identical"], correct: 0, note: "Decision trees use explicit rule-based branching; neural networks learn distributed weighted representations across layers." },
        ],
      },
      {
        id: "ai-bias",
        title: "AI Foundations & Bias",
        questions: [
          { q: "Which statement best describes the relationship between artificial intelligence and machine learning?", options: ["They are unrelated fields with no overlap", "AI is a small subset of machine learning", "Machine learning is a subset of AI focused on learning from data", "They are two names for the same field"], correct: 2, note: "ML is one approach within the broader field of AI." },
          { q: "A model loosely based on interconnected brain neurons, organised in layers that pass signals forward to make a prediction, is a:", options: ["Decision tree", "Linear regression model", "K-nearest neighbour model", "Neural network"], correct: 3, note: "Neural networks are structurally inspired by the brain's neurons and connections." },
          { q: "A facial recognition system trained mostly on one demographic performs poorly on others once deployed. This is most directly explained by:", options: ["Insufficient computing power", "A syntax error in the model code", "Bias present in the training dataset", "Overuse of reinforcement learning"], correct: 2, note: "A dataset that under-represents groups teaches the model that same skew." },
          { q: "A bank's loan-approval model cannot explain in human terms why a specific applicant was rejected — it only outputs a score. This lack of transparency is generally referred to as the model being a(n):", options: ["Overfit model", "Black box model", "Supervised model", "Regression model"], correct: 1, note: "A black box model produces outputs without an interpretable explanation of its internal reasoning." },
          { q: "After discovering a hiring model disadvantages a particular group due to skewed historical data, a team deliberately rebalances the training dataset before retraining. This is an attempt to address:", options: ["Overfitting", "Algorithmic bias", "Network latency", "SQL injection"], correct: 1, note: "Rebalancing training data is a common technique to reduce learned bias." },
          { q: "A model finds that ice cream sales and drowning incidents rise together and treats one as predictive of the other, without accounting for the shared cause — hot weather. This flawed reasoning is an example of:", options: ["Overfitting", "Mistaking correlation for causation", "Reinforcement learning", "Encapsulation"], correct: 1, note: "Two variables can correlate strongly due to a shared underlying cause without either causing the other." },
          { q: "A voice assistant is trained to recognise urgency in a user's tone, including the vocal changes typical of an acute stress response, so it can prioritise emergency requests. Incorporating this kind of human behavioural pattern into AI design means developers must understand:", options: ["Only programming language syntax", "Psychological and physiological patterns in human behaviour", "Only network protocols", "Only database normalisation"], correct: 1, note: "Designing AI that responds appropriately to human states requires understanding psychological and physiological behaviour patterns, not just code." },
          { q: "A chatbot deployed globally gives responses considered polite in one culture but inappropriately blunt in another, because it was trained mostly on data from a single cultural context. This illustrates why AI developers must consider:", options: ["Cultural protocols and belief systems in training data", "Only the CIA triad", "Only encryption strength", "Only two's complement representation"], correct: 0, note: "AI trained on culturally narrow data can behave inappropriately across different cultural contexts, so developers must account for cultural protocols and beliefs." },
          { q: "An AI-powered hiring tool rejects candidates from a specific suburb at a higher rate, traced back to historical hiring data reflecting past human decision-making biases, not the applicants' actual qualifications. Where did this bias most directly originate?", options: ["The programming language used", "Human/dataset source bias baked into historical training data", "Insufficient computing power", "The choice of neural network activation function"], correct: 1, note: "Bias embedded in historical human decisions and data sources gets learned and perpetuated by AI trained on it." },
        ],
      },
      {
        id: "eval-deployment",
        title: "Model Evaluation & Deployment",
        questions: [
          { q: "A spam filter correctly flags 95 out of 100 actual spam emails, but also wrongly flags 30 legitimate emails as spam. The measure of how many flagged emails were truly spam is:", options: ["Recall", "Precision", "Accuracy", "Bias"], correct: 1, note: "Precision measures how many of the positive predictions were actually correct." },
          { q: "Of 100 actual spam emails, a filter correctly identifies 95 of them as spam, missing only 5. This measure — how many of the actual positives were correctly found — is:", options: ["Precision", "Recall", "Specificity", "Loss"], correct: 1, note: "Recall measures how many actual positives the model successfully identified." },
          { q: "A medical test dataset has 990 healthy cases and only 10 disease cases. A model that always predicts 'healthy' scores 99% accuracy despite being useless for detecting the disease. This exposes a weakness of relying only on:", options: ["Precision", "Overall accuracy on imbalanced data", "Recall", "Reinforcement rewards"], correct: 1, note: "Accuracy can be misleading on imbalanced datasets where one class dominates." },
          { q: "After deployment, a fraud-detection model's real-world performance quietly degrades over months as customer behaviour shifts away from the patterns it was trained on. This phenomenon is known as:", options: ["Overfitting", "Model/data drift", "Underfitting", "Bias amplification"], correct: 1, note: "Drift occurs when the real-world data distribution diverges from what the model was trained on." },
          { q: "A team retrains and redeploys its recommendation model every week using fresh user interaction data, monitoring live metrics rather than treating the model as a one-time build. This reflects:", options: ["A one-off Waterfall deployment", "Continuous monitoring and retraining", "Static analysis", "Regression testing only"], correct: 1, note: "Ongoing monitoring and retraining keeps a deployed model aligned with changing real-world data." },
          { q: "A model reduces its input image's resolution and colour depth before training, deliberately discarding detail to cut computation cost. This step belongs to:", options: ["Model evaluation", "Feature engineering / pre-processing", "Deployment monitoring", "Bias mitigation"], correct: 1, note: "Pre-processing prepares raw input data before it's fed into training." },
          { q: "A factory replaces manual quality inspection with an automated vision system, reducing worker exposure to repetitive strain injury but also reducing the number of inspection jobs available. This trade-off reflects automation's impact on:", options: ["Only production efficiency", "Worker safety and the nature of available employment", "Only the economy", "Only waste and the environment"], correct: 1, note: "Automation can simultaneously improve worker safety and change the nature and number of available jobs." },
          { q: "A logistics company's automated routing software cuts fuel use and packaging waste by optimising delivery paths, while also concentrating profit gains mainly among shareholders rather than workers. This illustrates automation's dual impact on:", options: ["Only social issues", "Environmental efficiency and distribution of economic benefit", "Only algorithm accuracy", "Only data security"], correct: 1, note: "Automation's impacts span environmental efficiency gains and questions about how economic benefits are distributed." },
          { q: "A government considers mandating that any AI system used in hiring decisions must be explainable and auditable, partly in response to concerns about bias and accountability. This kind of requirement is primarily a response to:", options: ["Purely technical performance limitations", "Social, ethical and legal implications of automation", "Hardware degrees of freedom", "Two's complement overflow"], correct: 1, note: "Regulation of AI explainability responds to broader social, ethical and legal concerns about automated decision-making." },
        ],
      },
    ],
  },
  {
    id: "project",
    year: 12,
    title: "Software Engineering Project",
    file: "project.plan",
    accent: "#56d4dd",
    icon: FolderGit2,
    blurb: "Methodologies, planning & implementation.",
    nodes: [
      {
        id: "methodologies",
        title: "Methodologies",
        questions: [
          { q: "A team completes requirements, then design, then development, then testing, in that fixed order, never revisiting an earlier stage. This follows the:", options: ["Agile model", "WAgile model", "Pilot model", "Waterfall model"], correct: 3, note: "Waterfall moves through fixed, sequential stages." },
          { q: "A team re-prioritises its backlog every two weeks based on user feedback, adjusting scope as understanding improves. This follows the:", options: ["Waterfall model", "Direct implementation", "Agile model", "Parallel implementation"], correct: 2, note: "Agile embraces iteration and adapts the plan as the project progresses." },
          { q: "A team runs a strict Waterfall plan at the macro level but applies short Agile iterations within each stage. This hybrid is:", options: ["Direct implementation", "Pilot rollout", "WAgile", "Phased implementation"], correct: 2, note: "WAgile blends Waterfall's structure with Agile's flexibility." },
          { q: "Which tool would a project manager use to visualise task durations, dependencies and overlap across a timeline?", options: ["A class diagram", "A data dictionary", "A wiring diagram", "A Gantt chart"], correct: 3, note: "Gantt charts schedule and track project tasks over time." },
          { q: "A team holds a 15-minute stand-up each morning, works in fixed two-week sprints, and reviews completed work with stakeholders at the end of each sprint. This is best described as an implementation of:", options: ["Waterfall", "Scrum (an Agile framework)", "Direct implementation", "Pilot testing"], correct: 1, note: "Scrum structures Agile work into sprints with daily stand-ups and end-of-sprint reviews." },
          { q: "Early in a project, a team identifies that a key third-party API might be deprecated, estimates the impact and likelihood, and prepares a fallback plan in advance. This activity is:", options: ["Quality assurance", "Risk management", "Regression testing", "Version control"], correct: 1, note: "Risk management identifies, assesses and plans mitigations for potential problems before they occur." },
          { q: "A large, well-understood project with stable requirements uses a strict Waterfall approach, while a small, fast-moving startup project with evolving requirements uses Agile. Choosing between Waterfall, Agile and WAgile is most directly influenced by a project's:", options: ["Logo and branding", "Scale and type of development", "Font choice", "Server hosting provider"], correct: 1, note: "Choice of methodology is guided by the scale and type of development involved, not surface-level details." },
          { q: "Before committing to a project, a team checks whether it can be completed within the available budget and timeframe, alongside its technical requirements. This check is:", options: ["Scheduling and financial feasibility assessment", "Regression testing", "Peer checking", "Digital signing"], correct: 0, note: "Feasibility assessment evaluates whether a project is achievable within schedule and budget constraints." },
          { q: "The Waterfall model's stages are sometimes described metaphorically as 'falling water' because:", options: ["Water can flow back upstream to earlier stages easily", "Progress flows in one direction through fixed stages, like water falling rather than flowing back uphill", "It always fails on large projects", "It uses actual liquid cooling systems"], correct: 1, note: "The 'falling water' metaphor reflects Waterfall's one-directional progression through stages without returning to earlier ones." },
        ],
      },
      {
        id: "implementation",
        title: "Implementation Strategies",
        questions: [
          { q: "A hospital switches every department to new patient-record software on the same morning, retiring the old system immediately. This is:", options: ["Parallel implementation", "Phased implementation", "Pilot implementation", "Direct implementation"], correct: 3, note: "Direct implementation is an immediate, full cutover." },
          { q: "A company runs old and new payroll systems side by side for two pay cycles, comparing results before fully switching. This is:", options: ["Direct implementation", "Pilot implementation", "Parallel implementation", "Phased implementation"], correct: 2, note: "Parallel implementation runs both systems simultaneously before cutover." },
          { q: "A retailer rolls a new point-of-sale system out to one store first, evaluates the results, then decides whether to expand. This is:", options: ["Direct implementation", "Pilot implementation", "Parallel implementation", "Phased implementation"], correct: 1, note: "A pilot trials the system with a small group before wider rollout." },
          { q: "A university introduces a new enrolment system faculty by faculty over several months rather than everywhere at once. This is:", options: ["Direct implementation", "Pilot implementation", "Phased implementation", "Parallel implementation"], correct: 2, note: "Phased implementation rolls out in stages over time." },
          { q: "During a direct cutover, the new system fails within hours and the team must revert immediately to the old system with minimal data loss. Which implementation strategy would have most reduced this specific risk?", options: ["Direct implementation again", "Parallel implementation", "Increasing the marketing budget", "Skipping testing to move faster"], correct: 1, note: "Running old and new systems in parallel provides a safety net absent from a direct cutover." },
          { q: "Before switching to a new inventory system, staff attend hands-on sessions and receive reference guides so they can use it confidently from day one. This activity is best classified as part of:", options: ["Change management / user training", "Static analysis", "Version control", "Regression testing"], correct: 0, note: "Change management prepares users for a new system through training and support." },
          { q: "A government agency needs zero disruption to a critical national service and has the budget to run two full systems at once during transition, prioritising safety over cost. Which implementation approach best fits these priorities?", options: ["Direct implementation", "Parallel implementation", "The cheapest available option regardless of risk", "No implementation strategy at all"], correct: 1, note: "Parallel implementation suits scenarios where safety and continuity outweigh the extra cost of running two systems simultaneously." },
          { q: "A small business with a tight budget and low risk tolerance wants to trial a new booking system with a handful of customers before rolling it out to everyone. Which strategy fits best?", options: ["Pilot implementation", "Direct implementation", "Parallel implementation across all customers immediately", "Skipping implementation planning entirely"], correct: 0, note: "Piloting with a small group tests the system with limited risk before a wider rollout." },
          { q: "A national retailer wants to manage risk by rolling out region by region, so problems in one region can be fixed before the next goes live, without the ongoing cost of running two full systems everywhere at once. This best fits:", options: ["Parallel implementation", "Phased implementation", "Direct implementation", "Pilot implementation only, forever, in one store"], correct: 1, note: "Phased implementation manages risk by rolling out incrementally across regions or groups over time." },
        ],
      },
      {
        id: "quality",
        title: "Quality & Testing",
        questions: [
          { q: "Rather than checking requirements only at the very end, a team reviews and verifies them continuously throughout development. This reflects:", options: ["Direct implementation", "Pilot testing", "Ongoing quality assurance", "Static analysis"], correct: 2, note: "QA is a continual checking process, not a one-off step at the end." },
          { q: "A document defining what will be tested, what data will be used, and how results will be compared to expected results is a:", options: ["Data dictionary", "Gantt chart", "Wiring diagram", "Test plan"], correct: 3, note: "Test plans set out testing scope, methods and data to verify quality systematically." },
          { q: "A team checks that the software meets its written specifications exactly ('are we building the product right?'), separately from checking that it actually meets the client's real needs ('are we building the right product?'). These two checks are respectively known as:", options: ["Validation and verification", "Verification and validation", "Testing and debugging", "Static and dynamic analysis"], correct: 1, note: "Verification checks against specifications; validation checks against real needs." },
          { q: "Before final sign-off, the client personally runs the system against their own real-world scenarios to confirm it meets their needs before accepting delivery. This is:", options: ["Unit testing", "User acceptance testing", "Static analysis", "Regression testing"], correct: 1, note: "User acceptance testing has the client verify the system meets their actual needs before accepting it." },
          { q: "A test plan explicitly links every individual requirement to at least one test case that verifies it, so no requirement goes unchecked. This practice is:", options: ["Requirements traceability", "Data dictionary creation", "Pilot testing", "Gantt scheduling"], correct: 0, note: "Traceability ensures every requirement is covered by verifiable tests." },
          { q: "A manual written for end users explains how to use each feature in plain language, while a separate document details the system's internal architecture for future developers. These are respectively:", options: ["Test plan and Gantt chart", "User documentation and technical documentation", "Data dictionary and class diagram", "Wiring diagram and structure chart"], correct: 1, note: "User documentation targets end users; technical documentation targets developers maintaining the system." },
          { q: "Before testing begins, a team writes down exactly which criteria — such as response time under 2 seconds and zero critical bugs — will count as 'acceptable quality' for the project. Defining these criteria upfront matters because:", options: ["It has no effect on testing outcomes", "Without agreed criteria, there's no objective way to judge whether quality has been achieved", "It replaces the need for a test plan", "It only matters for Waterfall projects"], correct: 1, note: "Defining quality criteria upfront gives testing an objective benchmark to measure against." },
          { q: "A healthcare software project must ensure patient data handling meets government privacy laws, not just the client's functional requirements. Addressing this is part of:", options: ["Compliance and legislative requirements", "Boundary value testing", "Version control", "Facade design"], correct: 0, note: "Quality assurance includes ensuring software meets relevant legal and regulatory obligations, not just functional specs." },
          { q: "A team continually re-checks that each new feature still satisfies the original requirements throughout development, rather than checking only once at the very end. This 'continual checking process' is best described as:", options: ["A test plan", "Quality assurance", "A Gantt chart", "Risk management"], correct: 1, note: "Quality assurance is defined as a continual checking process ensuring requirements are met throughout a project." },
        ],
      },
      {
        id: "roles-management",
        title: "Roles & Management",
        questions: [
          { q: "A person is responsible for scoping the project, managing the budget, timeline and communication with stakeholders, without necessarily writing code themselves. This role is the:", options: ["Software architect", "Project manager", "Quality assurance tester", "Systems analyst"], correct: 1, note: "The project manager coordinates scope, schedule, budget and stakeholders." },
          { q: "Before any code is written, a person interviews stakeholders to determine exactly what the system must do and documents these as formal requirements. This role is most likely the:", options: ["Systems analyst", "Database administrator", "DevOps engineer", "UI designer"], correct: 0, note: "Systems analysts gather and document requirements from stakeholders." },
          { q: "A person is responsible for the overall structure of the system — deciding how components communicate and which technologies to use — while other developers implement the details. This role is the:", options: ["Project manager", "Software architect", "Quality assurance tester", "Systems analyst"], correct: 1, note: "The software architect defines the high-level technical structure of a system." },
          { q: "A project's stakeholders include the people funding it, the end users who will use it daily, and the developers who build it — all with different, sometimes conflicting priorities. Balancing these competing needs is primarily the responsibility of:", options: ["The compiler", "Version control software", "The project manager", "The database"], correct: 2, note: "Managing competing stakeholder priorities is a core project management responsibility." },
          { q: "A team estimates a two-week task will actually take three weeks due to unfamiliar technology, and updates the Gantt chart accordingly rather than pretending the original estimate still holds. This reflects good:", options: ["Static analysis", "Realistic scope and schedule management", "Sandboxing", "Symmetric encryption"], correct: 1, note: "Adjusting schedules honestly as new information emerges is core to sound project management." },
          { q: "A retrospective meeting held at the end of each sprint asks what went well, what didn't, and what the team will change next time. This practice primarily supports:", options: ["Continuous improvement of team process", "Static application security testing", "Database normalisation", "Digital signature verification"], correct: 0, note: "Retrospectives drive iterative improvement of how the team works, not the product's technical content." },
          { q: "On a project team, tasks are deliberately assigned based on who has the most relevant expertise — the strongest database skills go to the data layer, the strongest UI skills go to the front end. This delegation approach primarily supports:", options: ["Faster compilation times", "Higher-quality outcomes through expertise-matched collaboration", "Avoiding all testing", "Removing the need for a project manager"], correct: 1, note: "Delegating tasks based on individual expertise is a recognised way collaboration improves solution quality." },
          { q: "A project team keeps the client actively involved throughout development, regularly seeking feedback and negotiating scope changes together, rather than only presenting a finished product at the end. This approach to communication is intended to:", options: ["Slow down every decision unnecessarily", "Empower the client and enable meaningful feedback throughout the project", "Remove the need for a test plan", "Replace the need for a Gantt chart"], correct: 1, note: "Involving and empowering the client with ongoing feedback and negotiation is a recognised communication practice for project work." },
          { q: "When a development team gets stuck on a difficult technical problem, three reasonable strategies are searching for existing solutions online, collaborating with peers, and engaging external specialists. This last strategy — bringing in specialists from outside the team — is known as:", options: ["Outsourcing", "Pair programming", "Regression testing", "Static analysis"], correct: 0, note: "Outsourcing brings in external expertise to help resolve difficulties the internal team can't solve alone." },
        ],
      },
    ],
  },
];

const LEVEL_TITLES = [
  "Trainee", "Junior Dev", "Software Engineer", "Senior Engineer",
  "Tech Lead", "Principal Engineer", "Systems Architect",
];

const STORAGE_KEY = "se-bootcamp-progress-v2";
const API_KEY_STORAGE = "se-bootcamp-groq-key";
const AI_MODE_STORAGE = "se-bootcamp-ai-mode";
const SYLLABUS_STORAGE = "se-bootcamp-syllabus-v1";
const SYLLABUS_MAX_CHARS = 4000; // ~1k tokens — Groq's free on_demand tier caps gpt-oss-20b at 8000 tokens/min total
const AI_QUESTION_MODEL = "openai/gpt-oss-20b";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const TIME_LIMIT = 20; // seconds per question

function shuffledIndices(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/**
 * Extracts plain text from an uploaded syllabus file. Text/Markdown files are
 * read directly; PDFs are parsed page-by-page in the browser via pdf.js.
 * Truncated to SYLLABUS_MAX_CHARS to keep later prompts a bounded size/cost.
 */
async function extractTextFromFile(file) {
  let text;
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@4.7.76/build/pdf.worker.mjs";
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => it.str).join(" "));
    }
    text = pages.join("\n\n");
  } else {
    text = await file.text();
  }
  text = text.trim();
  if (!text) throw new Error("No readable text found in that file");
  if (text.length > SYLLABUS_MAX_CHARS) {
    text = text.slice(0, SYLLABUS_MAX_CHARS) + "\n\n[...truncated...]";
  }
  return text;
}

/**
 * Calls Groq's OpenAI-compatible API directly from the browser to generate a
 * fresh batch of multiple-choice questions for a node, styled after its
 * existing bank and, when provided, grounded in the user's own uploaded
 * syllabus text. Groq serves the free, open-weight gpt-oss model used here.
 * The user's own API key is stored only in localStorage and never leaves
 * their machine except in requests to Groq.
 */
async function generateAiQuestions(apiKey, mod, node, count, syllabusText) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL, dangerouslyAllowBrowser: true });

  const sample = node.questions.slice(0, 3).map((q) => ({ q: q.q, options: q.options, correct: q.correct }));

  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            q: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct: { type: "integer" },
            note: { type: "string" },
          },
          required: ["q", "options", "correct", "note"],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  };

  const prompt =
    `You are writing multiple-choice quiz questions for a NSW Year 11/12 Software Engineering syllabus study game.\n` +
    `Module: "${mod.title}" (${mod.file}). Topic/node: "${node.title}".\n\n` +
    (syllabusText
      ? `The user has uploaded their own syllabus/reference document. Treat it as the authoritative source for terminology, scope and depth whenever it covers this topic — prefer it over general knowledge where they conflict:\n"""\n${syllabusText}\n"""\n\n`
      : "") +
    `Write ${count} NEW, difficult, scenario-based multiple-choice questions on exactly this topic. ` +
    `Match the style of these existing examples but do not repeat or trivially reword them:\n` +
    JSON.stringify(sample, null, 2) +
    `\n\nRules:\n` +
    `- Each question has exactly 4 options.\n` +
    `- "correct" is the 0-indexed position of the correct option within "options".\n` +
    `- "note" is a one-sentence explanation of why that answer is correct.\n` +
    `- Questions must be accurate, unambiguous, and harder than a simple definition lookup — favour applied scenarios with plausible, non-trivial distractors.`;

  const response = await client.chat.completions.create({
    model: AI_QUESTION_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_schema", json_schema: { name: "quiz_questions", strict: true, schema } },
    max_completion_tokens: Math.min(4000, count * 220 + 300),
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Model returned no content");
  const parsed = JSON.parse(raw);
  const qs = (parsed.questions || [])
    .filter(
      (q) =>
        q &&
        typeof q.q === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correct) &&
        q.correct >= 0 &&
        q.correct < 4
    )
    .map((q) => ({ q: q.q, options: q.options, correct: q.correct, note: q.note || "" }));

  if (qs.length < 3) throw new Error("Model did not return enough usable questions");
  return qs;
}

function levelForXp(xp) {
  const level = Math.min(LEVEL_TITLES.length - 1, Math.floor(xp / 120));
  const floor = level * 120;
  const next = (level + 1) * 120;
  return { level, title: LEVEL_TITLES[level], floor, next, pct: level >= LEVEL_TITLES.length - 1 ? 100 : Math.round(((xp - floor) / (next - floor)) * 100) };
}

function nodeKey(moduleId, nodeId) {
  return `${moduleId}::${nodeId}`;
}

/* ------------------------------------------------------------------ */
/*  APP                                                                 */
/* ------------------------------------------------------------------ */

export default function SEBootcamp() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState({ xp: 0, best: {}, runs: 0 });
  const [screen, setScreen] = useState("home"); // home | tree | quiz | result
  const [activeModule, setActiveModule] = useState(null);
  const [activeNode, setActiveNode] = useState(null);

  // quiz-in-progress state
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stability, setStability] = useState(100);
  const [runXp, setRunXp] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [order, setOrder] = useState([]);
  const [runQuestions, setRunQuestions] = useState([]);

  // AI question generation
  const [apiKey, setApiKey] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [genError, setGenError] = useState(null);
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusName, setSyllabusName] = useState("");

  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) setProgress(JSON.parse(res.value));
      } catch (e) {
        /* no saved progress yet */
      } finally {
        setReady(true);
      }
    })();
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE);
      if (storedKey) setApiKey(storedKey);
      setAiMode(localStorage.getItem(AI_MODE_STORAGE) === "1");
      const storedSyllabus = localStorage.getItem(SYLLABUS_STORAGE);
      if (storedSyllabus) {
        const parsed = JSON.parse(storedSyllabus);
        setSyllabusText(parsed.text || "");
        setSyllabusName(parsed.name || "");
      }
    } catch (e) {
      /* localStorage unavailable */
    }
  }, []);

  function saveApiKey(key) {
    setApiKey(key);
    try {
      if (key) localStorage.setItem(API_KEY_STORAGE, key);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch (e) {
      /* ignore */
    }
  }

  function toggleAiMode(on) {
    setAiMode(on);
    try {
      localStorage.setItem(AI_MODE_STORAGE, on ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  function saveSyllabus(name, text) {
    setSyllabusName(name);
    setSyllabusText(text);
    try {
      if (text) localStorage.setItem(SYLLABUS_STORAGE, JSON.stringify({ name, text }));
      else localStorage.removeItem(SYLLABUS_STORAGE);
    } catch (e) {
      /* ignore — syllabus still usable for this session even if it can't persist */
    }
  }

  function clearSyllabus() {
    saveSyllabus("", "");
  }

  const persist = useCallback((next) => {
    setProgress(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
      } catch (e) {
        /* ignore save failure */
      }
    }, 250);
  }, []);

  function openTree(mod) {
    setActiveModule(mod);
    setScreen("tree");
  }

  function resetRunState() {
    setQIndex(0);
    setSelected(null);
    setLocked(false);
    setTimedOut(false);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setStability(100);
    setRunXp(0);
    setCrashed(false);
  }

  function beginRun(questions) {
    setRunQuestions(questions);
    setOrder(shuffledIndices(questions.length));
    setScreen("quiz");
  }

  async function startNode(mod, node) {
    setActiveModule(mod);
    setActiveNode(node);
    resetRunState();
    setGenError(null);

    if (aiMode && apiKey) {
      setScreen("generating");
      try {
        const aiQuestions = await generateAiQuestions(apiKey, mod, node, node.questions.length, syllabusText);
        beginRun(aiQuestions);
      } catch (e) {
        console.error("AI question generation failed:", e);
        const detail = e && (e.message || e.name) ? `${e.name || "Error"}: ${e.message || "(no message)"}` : "Failed to generate AI questions.";
        setGenError(detail);
        beginRun(node.questions);
      }
      return;
    }

    beginRun(node.questions);
  }

  function answer(optionIdx, isTimeout) {
    if (locked || crashed) return;
    const qi = order[qIndex];
    const question = runQuestions[qi];
    const isCorrect = !isTimeout && optionIdx === question.correct;
    setSelected(isTimeout ? -1 : optionIdx);
    setLocked(true);
    setTimedOut(!!isTimeout);

    if (isCorrect) {
      const newStreak = streak + 1;
      const bonus = Math.min(newStreak - 1, 5) * 3;
      const gained = 10 + bonus;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      setRunXp((x) => x + gained);
    } else {
      setStreak(0);
      setStability((s) => {
        const next = Math.max(0, s - 34);
        if (next === 0) setCrashed(true);
        return next;
      });
    }
  }

  function nextQuestion() {
    if (crashed || qIndex + 1 >= order.length) {
      finishRun();
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setLocked(false);
    setTimedOut(false);
  }

  function finishRun() {
    const total = order.length;
    const pctScore = Math.round((correctCount / total) * 100);
    const stars = pctScore === 100 ? 3 : pctScore >= 70 ? 2 : pctScore >= 40 ? 1 : 0;
    const key = nodeKey(activeModule.id, activeNode.id);
    const prevBest = progress.best[key];
    // A crashed run must never create or improve a best-record for this node —
    // otherwise the next node in the tree would unlock off a failed attempt.
    const best = crashed
      ? progress.best
      : {
          ...progress.best,
          [key]: !prevBest || pctScore > prevBest.pct
            ? { pct: pctScore, stars, correct: correctCount, total }
            : prevBest,
        };
    const next = {
      xp: progress.xp + runXp,
      runs: (progress.runs || 0) + 1,
      best,
    };
    persist(next);
    setScreen("result");
  }

  function backToTree() {
    setScreen("tree");
    setActiveNode(null);
  }

  function backHome() {
    setScreen("home");
    setActiveModule(null);
    setActiveNode(null);
  }

  async function resetProgress() {
    persist({ xp: 0, best: {}, runs: 0 });
  }

  if (!ready) {
    return (
      <div style={S.appShell}>
        <div style={{ ...S.mono, color: "#7d8590", fontSize: 13 }}>booting se//bootcamp …</div>
      </div>
    );
  }

  return (
    <div style={S.appShell}>
      <style>{`
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes popIn { from{opacity:0; transform:scale(.94)} to{opacity:1; transform:scale(1)} }
        @keyframes slideUp { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
        @keyframes shake { 10%,90%{transform:translateX(-1px)} 20%,80%{transform:translateX(2px)} 30%,50%,70%{transform:translateX(-4px)} 40%,60%{transform:translateX(4px)} }
        @keyframes pulseRed { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .cursor-blink { animation: blink 1s step-start infinite; }
        .spin { animation: spin 0.9s linear infinite; }
        .opt-btn:hover:not(:disabled) { border-color: var(--accent) !important; background: rgba(255,255,255,0.04) !important; }
        .node-btn:hover .node-circle { transform: scale(1.08); }
        .node-btn:hover .node-title { color: #fff !important; }
        .tree-node:not(.locked):hover { border-color: var(--accent) !important; transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #232b36; border-radius: 4px; }
      `}</style>

      {screen === "home" && (
        <HomeScreen
          progress={progress}
          onOpen={openTree}
          onReset={resetProgress}
          apiKey={apiKey}
          aiMode={aiMode}
          onSaveApiKey={saveApiKey}
          onToggleAiMode={toggleAiMode}
          syllabusName={syllabusName}
          syllabusText={syllabusText}
          onSaveSyllabus={saveSyllabus}
          onClearSyllabus={clearSyllabus}
        />
      )}
      {screen === "tree" && activeModule && (
        <TreeScreen mod={activeModule} progress={progress} onStart={startNode} onHome={backHome} />
      )}
      {screen === "generating" && activeModule && activeNode && (
        <GeneratingScreen mod={activeModule} node={activeNode} />
      )}
      {screen === "quiz" && activeModule && activeNode && runQuestions.length > 0 && (
        <QuizScreen
          mod={activeModule}
          node={activeNode}
          questions={runQuestions}
          order={order}
          qIndex={qIndex}
          selected={selected}
          locked={locked}
          timedOut={timedOut}
          streak={streak}
          stability={stability}
          runXp={runXp}
          crashed={crashed}
          aiGenerated={aiMode && !genError}
          genError={genError}
          onPick={(i) => answer(i, false)}
          onTimeout={() => answer(-1, true)}
          onNext={nextQuestion}
          onQuit={backToTree}
        />
      )}
      {screen === "result" && activeModule && activeNode && (
        <ResultScreen
          mod={activeModule}
          node={activeNode}
          correctCount={correctCount}
          total={order.length}
          runXp={runXp}
          bestStreak={bestStreak}
          crashed={crashed}
          onRetry={() => startNode(activeModule, activeNode)}
          onTree={backToTree}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME — commit-graph module map                                     */
/* ------------------------------------------------------------------ */

function HomeScreen({ progress, onOpen, onReset, apiKey, aiMode, onSaveApiKey, onToggleAiMode, syllabusName, syllabusText, onSaveSyllabus, onClearSyllabus }) {
  const lvl = levelForXp(progress.xp);
  const y11 = MODULES.filter((m) => m.year === 11);
  const y12 = MODULES.filter((m) => m.year === 12);
  const totalNodes = MODULES.reduce((n, m) => n + m.nodes.length, 0);
  const clearedNodes = Object.values(progress.best).filter((b) => b.stars > 0).length;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
        <div>
          <div style={{ ...S.mono, fontSize: 12, color: "#56d4dd", letterSpacing: 1.5, marginBottom: 6 }}>
            ~/nesa/software-engineering-11-12
          </div>
          <h1 style={{ ...S.display, fontSize: 34, margin: 0, color: "#e6edf3", display: "flex", alignItems: "center", gap: 10 }}>
            <GitBranch size={30} color="#56d4dd" strokeWidth={2.2} />
            se<span style={{ color: "#3fb950" }}>//</span>bootcamp
          </h1>
          <div style={{ ...S.mono, fontSize: 12.5, color: "#7d8590", marginTop: 6, maxWidth: 480 }}>
            Merge your way through the NSW syllabus. Each topic is a skill tree — clear a node before the timer runs out to unlock the next.
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(86,212,221,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={20} color="#56d4dd" />
            </div>
            <div>
              <div style={{ ...S.mono, fontSize: 11, color: "#7d8590" }}>LEVEL {lvl.level + 1}</div>
              <div style={{ ...S.display, fontSize: 15, color: "#e6edf3" }}>{lvl.title}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", ...S.mono, fontSize: 10.5, color: "#7d8590", marginBottom: 4 }}>
              <span>{progress.xp} XP</span>
              <span>{lvl.pct}%</span>
            </div>
            <div style={{ height: 6, background: "#161d27", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${lvl.pct}%`, background: "linear-gradient(90deg,#3fb950,#56d4dd)", borderRadius: 4, transition: "width .4s ease" }} />
            </div>
          </div>
          <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 10 }}>
            {clearedNodes}/{totalNodes} nodes cleared · {progress.runs || 0} runs
          </div>
        </div>
      </div>

      <div style={{ ...S.panel, padding: "26px 20px 14px", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <BranchColumn label="year 11 branch" color="#3fb950" modules={y11} progress={progress} onOpen={onOpen} align="right" />
          <BranchColumn label="year 12 branch" color="#56d4dd" modules={y12} progress={progress} onOpen={onOpen} align="left" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "22px 0 16px", ...S.mono, fontSize: 11.5, color: "#7d8590" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #232b36)" }} />
          <GitMerge size={15} color="#f2cc60" />
          <span>project skills merge into every module</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #232b36, transparent)" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <button
          onClick={onReset}
          style={{ ...S.mono, fontSize: 11, color: "#4b5563", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f85149")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5563")}
        >
          <RotateCcw size={12} /> reset progress
        </button>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          style={{ ...S.mono, fontSize: 11, color: aiMode ? "#f2cc60" : "#4b5563", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f2cc60")}
          onMouseLeave={(e) => (e.currentTarget.style.color = aiMode ? "#f2cc60" : "#4b5563")}
        >
          <Settings size={12} /> AI questions{aiMode ? " (on)" : ""}
        </button>
      </div>

      {settingsOpen && (
        <AiSettingsPanel
          apiKey={apiKey}
          aiMode={aiMode}
          onSaveApiKey={onSaveApiKey}
          onToggleAiMode={onToggleAiMode}
          syllabusName={syllabusName}
          syllabusText={syllabusText}
          onSaveSyllabus={onSaveSyllabus}
          onClearSyllabus={onClearSyllabus}
        />
      )}
    </div>
  );
}

function AiSettingsPanel({ apiKey, aiMode, onSaveApiKey, onToggleAiMode, syllabusName, syllabusText, onSaveSyllabus, onClearSyllabus }) {
  const [draft, setDraft] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const text = await extractTextFromFile(file);
      onSaveSyllabus(file.name, text);
    } catch (err) {
      setUploadError(err && err.message ? err.message : "Could not read that file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ ...S.panel, maxWidth: 480, margin: "16px auto 0", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...S.display, fontSize: 13.5, color: "#e6edf3", marginBottom: 10 }}>
        <Sparkles size={14} color="#f2cc60" /> AI-generated questions
      </div>
      <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", lineHeight: 1.6, marginBottom: 14 }}>
        Paste your own free Groq API key (get one at console.groq.com — no card required) to have {AI_QUESTION_MODEL}, a free open-weight model, write a fresh batch of questions for a node every time you start it, instead of the built-in question bank. The key is stored only in this browser's local storage and is sent directly from your browser to Groq's API — never to any other server. Only use a key you control, on a device you trust.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type={showKey ? "text" : "password"}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
            placeholder="gsk_…"
            style={{
              width: "100%", boxSizing: "border-box", ...S.mono, fontSize: 12, color: "#e6edf3",
              background: "#0d1219", border: "1px solid #232b36", borderRadius: 8,
              padding: "9px 34px 9px 10px",
            }}
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: 4 }}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={() => { onSaveApiKey(draft.trim()); setSaved(true); }}
          style={{ ...S.primaryBtn("#f2cc60"), padding: "9px 16px" }}
        >
          {saved ? <Check size={14} /> : "save"}
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, ...S.mono, fontSize: 12, color: "#c9d1d9", cursor: "pointer", marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={aiMode}
          onChange={(e) => onToggleAiMode(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: "#f2cc60" }}
        />
        Use AI-generated questions instead of the question bank
      </label>
      {aiMode && !apiKey && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#f85149", marginBottom: 16 }}>
          Add and save an API key above — without one, quizzes fall back to the question bank.
        </div>
      )}

      <div style={{ borderTop: "1px solid #1f2734", paddingTop: 14 }}>
        <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", lineHeight: 1.6, marginBottom: 10 }}>
          Optionally upload your own syllabus, notes or course outline (PDF, .txt or .md). The model will treat it as the authoritative source for terminology, scope and depth when writing questions.
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.markdown,text/plain,application/pdf" onChange={handleFile} style={{ display: "none" }} />

        {syllabusName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d1219", border: "1px solid #232b36", borderRadius: 8, padding: "9px 10px" }}>
            <FileText size={14} color="#3fb950" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...S.mono, fontSize: 11.5, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syllabusName}</div>
              <div style={{ ...S.mono, fontSize: 10, color: "#4b5563" }}>{(syllabusText || "").length.toLocaleString()} characters loaded</div>
            </div>
            <button onClick={onClearSyllabus} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            style={{ ...S.ghostBtn, width: "100%", justifyContent: "center", cursor: uploading ? "default" : "pointer" }}
          >
            {uploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
            {uploading ? "reading file…" : "upload syllabus"}
          </button>
        )}
        {uploadError && (
          <div style={{ ...S.mono, fontSize: 10.5, color: "#f85149", marginTop: 8 }}>{uploadError}</div>
        )}
      </div>
    </div>
  );
}

function BranchColumn({ label, color, modules, progress, onOpen, align }) {
  return (
    <div>
      <div style={{ ...S.mono, fontSize: 11, color, letterSpacing: 1, marginBottom: 14, textAlign: align === "right" ? "right" : "left", display: "flex", alignItems: "center", gap: 6, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {align === "left" && <GitCommit size={12} />}
        {label}
        {align === "right" && <GitCommit size={12} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {modules.map((m) => (
          <ModuleNode key={m.id} mod={m} progress={progress} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function ModuleNode({ mod, progress, onOpen }) {
  const Icon = mod.icon;
  const cleared = mod.nodes.filter((n) => {
    const b = progress.best[nodeKey(mod.id, n.id)];
    return b && b.stars > 0;
  }).length;

  return (
    <button
      className="node-btn"
      onClick={() => onOpen(mod)}
      style={{
        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
        background: "#11161d", border: "1px solid #1f2734", borderRadius: 12,
        padding: "12px 14px", cursor: "pointer", transition: "border-color .15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = mod.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1f2734")}
    >
      <div
        className="node-circle"
        style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .15s ease",
        }}
      >
        <Icon size={18} color={mod.accent} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="node-title" style={{ ...S.display, fontSize: 14, color: "#c9d1d9", transition: "color .15s ease" }}>
          {mod.title}
        </div>
        <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 1 }}>{mod.file} · {mod.nodes.length} nodes</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ ...S.mono, fontSize: 11, color: cleared === mod.nodes.length ? "#3fb950" : "#7d8590" }}>
          {cleared}/{mod.nodes.length}
        </div>
        <ChevronRight size={16} color="#3d4552" />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TREE — per-topic skill tree                                        */
/* ------------------------------------------------------------------ */

function TreeScreen({ mod, progress, onStart, onHome }) {
  const Icon = mod.icon;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 60px" }}>
      <button onClick={onHome} style={{ ...S.ghostBtn, marginBottom: 20 }}>
        <ArrowLeft size={14} /> module map
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={mod.accent} />
        </div>
        <div>
          <div style={{ ...S.display, fontSize: 21, color: "#e6edf3" }}>{mod.title}</div>
          <div style={{ ...S.mono, fontSize: 11.5, color: "#7d8590" }}>{mod.blurb}</div>
        </div>
      </div>

      <div style={{ ...S.mono, fontSize: 11, color: "#4b5563", margin: "18px 0 22px" }}>
        <span style={{ color: "#f2cc60" }}>// </span>clear each node to unlock the next — {TIME_LIMIT}s per question
      </div>

      <div style={{ position: "relative", paddingLeft: 4 }}>
        {mod.nodes.map((node, i) => {
          const best = progress.best[nodeKey(mod.id, node.id)];
          const prevBest = i === 0 ? null : progress.best[nodeKey(mod.id, mod.nodes[i - 1].id)];
          const locked = i > 0 && !prevBest;
          const isLast = i === mod.nodes.length - 1;

          return (
            <div key={node.id} style={{ display: "flex", gap: 16, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: locked ? "#161d27" : best ? `${mod.accent}22` : "#11161d",
                  border: `2px solid ${locked ? "#232b36" : best ? mod.accent : mod.accent + "88"}`,
                  ...S.mono, fontSize: 13, color: locked ? "#3d4552" : "#e6edf3", zIndex: 1,
                }}>
                  {locked ? <Lock size={14} /> : best ? <Check size={16} color={mod.accent} /> : i + 1}
                </div>
                {!isLast && <div style={{ width: 2, flex: 1, minHeight: 44, background: locked || !best ? "#1f2734" : mod.accent, marginTop: 2, opacity: locked ? 0.5 : 1 }} />}
              </div>

              <button
                className={`tree-node ${locked ? "locked" : ""}`}
                disabled={locked}
                onClick={() => onStart(mod, node)}
                style={{
                  "--accent": mod.accent,
                  flex: 1, marginBottom: 20, textAlign: "left", cursor: locked ? "not-allowed" : "pointer",
                  background: "#11161d", border: "1px solid #1f2734", borderRadius: 12,
                  padding: "13px 16px", opacity: locked ? 0.5 : 1, transition: "border-color .15s ease, transform .15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ ...S.display, fontSize: 14.5, color: "#e6edf3" }}>{node.title}</div>
                    <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 2 }}>
                      {node.questions.length} questions{locked ? " · locked" : best ? ` · best ${best.pct}%` : ""}
                    </div>
                  </div>
                  {best ? (
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      {[0, 1, 2].map((s) => (
                        <Star key={s} size={13} fill={s < best.stars ? "#f2cc60" : "none"} color={s < best.stars ? "#f2cc60" : "#2d3542"} />
                      ))}
                    </div>
                  ) : !locked ? (
                    <ChevronRight size={16} color="#3d4552" />
                  ) : null}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GENERATING — waiting on AI-authored questions                      */
/* ------------------------------------------------------------------ */

function GeneratingScreen({ mod, node }) {
  const Icon = mod.icon;
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "100px 20px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <Icon size={24} color={mod.accent} />
      </div>
      <div style={{ ...S.display, fontSize: 16, color: "#e6edf3", marginBottom: 6 }}>{node.title}</div>
      <div style={{ ...S.mono, fontSize: 12, color: "#7d8590", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Sparkles size={13} color="#f2cc60" />
        generating fresh questions with AI
        <span className="cursor-blink">_</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QUIZ                                                                */
/* ------------------------------------------------------------------ */

function QuizScreen({ mod, node, questions, order, qIndex, selected, locked, timedOut, streak, stability, runXp, crashed, aiGenerated, genError, onPick, onTimeout, onNext, onQuit }) {
  const qi = order[qIndex];
  const question = questions[qi];
  const Icon = mod.icon;
  const progressPct = Math.round(((qIndex + (locked ? 1 : 0)) / order.length) * 100);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
  }, [qIndex]);

  useEffect(() => {
    if (locked || crashed) return;
    if (timeLeft <= 0) {
      onTimeoutRef.current();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, locked, crashed]);

  const timeColor = timeLeft > 12 ? "#3fb950" : timeLeft > 6 ? "#f2cc60" : "#f85149";
  const timePct = Math.round((timeLeft / TIME_LIMIT) * 100);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <button onClick={onQuit} style={S.ghostBtn}>
          <ArrowLeft size={14} /> exit
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, ...S.mono, fontSize: 12, color: mod.accent }}>
          <Icon size={15} /> {node.title}
          {aiGenerated && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#f2cc60", fontSize: 10.5 }}>
              <Sparkles size={11} /> AI
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, ...S.mono, fontSize: 12, color: "#f2cc60" }}>
          <Zap size={13} /> {runXp} xp
        </div>
      </div>

      {genError && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#f2cc60", marginBottom: 12, textAlign: "center" }}>
          AI question generation failed ({genError}) — using the question bank instead.
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...S.mono, fontSize: 10.5, color: "#4b5563", marginBottom: 4 }}>
          <span>question {Math.min(qIndex + 1, order.length)} / {order.length}</span>
          <span>build {progressPct}%</span>
        </div>
        <div style={{ height: 5, background: "#161d27", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${mod.accent}99, ${mod.accent})`, transition: "width .35s ease" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ ...S.panel, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Activity size={14} color={stability > 66 ? "#3fb950" : stability > 33 ? "#f2cc60" : "#f85149"} />
          <div style={{ ...S.mono, fontSize: 10, color: "#7d8590", flexShrink: 0 }}>STABILITY</div>
          <div style={{ flex: 1, height: 7, background: "#0a0e14", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stability}%`, background: stability > 66 ? "#3fb950" : stability > 33 ? "#f2cc60" : "#f85149", borderRadius: 4, transition: "width .3s ease" }} />
          </div>
          <div style={{ ...S.mono, fontSize: 11, color: "#c9d1d9", width: 30, textAlign: "right", flexShrink: 0 }}>{stability}%</div>
        </div>

        <div style={{ ...S.panel, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, animation: !locked && timeLeft <= 5 ? "pulseRed .6s ease-in-out infinite" : "none" }}>
          <Clock size={14} color={timeColor} />
          <div style={{ ...S.mono, fontSize: 10, color: "#7d8590", flexShrink: 0 }}>TIME</div>
          <div style={{ flex: 1, height: 7, background: "#0a0e14", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${locked ? timePct : timePct}%`, background: timeColor, borderRadius: 4, transition: "width 1s linear" }} />
          </div>
          <div style={{ ...S.mono, fontSize: 11, color: timeColor, width: 30, textAlign: "right", flexShrink: 0 }}>{Math.max(0, timeLeft)}s</div>
        </div>
      </div>

      {streak > 1 && !locked && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#f2cc60", display: "flex", alignItems: "center", gap: 3, marginBottom: 12, justifyContent: "flex-end" }}>
          <Sparkles size={12} /> streak ×{streak}
        </div>
      )}

      <div style={{ ...S.panel, padding: 0, overflow: "hidden", animation: "slideUp .25s ease" }} key={qIndex}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderBottom: "1px solid #1f2734", background: "#0d1219" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f85149" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f2cc60" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3fb950" }} />
          <span style={{ ...S.mono, fontSize: 11, color: "#4b5563", marginLeft: 8 }}>{mod.file} — question.q({qIndex + 1})</span>
        </div>
        <div style={{ padding: "22px 22px 8px" }}>
          <div style={{ ...S.mono, fontSize: 11, color: mod.accent, marginBottom: 8 }}>
            <span style={{ color: "#4b5563" }}>{"> "}</span>
            evaluate<span className="cursor-blink" style={{ color: mod.accent }}>_</span>
          </div>
          <div style={{ ...S.display, fontSize: 17, lineHeight: 1.45, color: "#e6edf3" }}>{question.q}</div>
        </div>

        <div style={{ padding: "8px 22px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {question.options.map((opt, i) => {
            let stateStyle = { borderColor: "#232b36", background: "#0d1219" };
            let icon = null;
            if (locked) {
              if (i === question.correct) {
                stateStyle = { borderColor: "#3fb950", background: "rgba(63,185,80,0.09)" };
                icon = <CheckCircle2 size={17} color="#3fb950" />;
              } else if (i === selected) {
                stateStyle = { borderColor: "#f85149", background: "rgba(248,81,73,0.09)" };
                icon = <XCircle size={17} color="#f85149" />;
              } else {
                stateStyle = { borderColor: "#1a2029", background: "#0d1219", opacity: 0.5 };
              }
            }
            return (
              <button
                key={i}
                className="opt-btn"
                disabled={locked}
                onClick={() => onPick(i)}
                style={{
                  ...S.mono, fontSize: 13.5, textAlign: "left", color: "#c9d1d9",
                  padding: "12px 14px", borderRadius: 9, border: "1px solid",
                  cursor: locked ? "default" : "pointer", display: "flex",
                  alignItems: "center", justifyContent: "space-between", gap: 10,
                  transition: "border-color .12s ease, background .12s ease",
                  "--accent": mod.accent, ...stateStyle,
                }}
              >
                <span style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#4b5563" }}>{String.fromCharCode(97 + i)})</span>
                  {opt}
                </span>
                {icon}
              </button>
            );
          })}
        </div>

        {locked && (
          <div style={{ padding: "0 22px 22px", animation: "slideUp .2s ease" }}>
            {timedOut && (
              <div style={{ ...S.mono, fontSize: 11, color: "#f85149", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={12} /> time's up — treated as incorrect
              </div>
            )}
            <div style={{ padding: "12px 14px", borderRadius: 9, background: "#0d1219", border: "1px solid #1f2734", ...S.mono, fontSize: 12, color: "#7d8590", lineHeight: 1.5 }}>
              <span style={{ color: "#56d4dd" }}>// note </span>{question.note}
            </div>
            <button onClick={onNext} style={{ ...S.primaryBtn(mod.accent), marginTop: 14, width: "100%" }}>
              {crashed ? "view crash report" : qIndex + 1 >= order.length ? "finish build" : "next question"}
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {crashed && locked && (
        <div style={{ ...S.mono, fontSize: 11, color: "#f85149", textAlign: "center", marginTop: 10, animation: "shake .4s ease" }}>
          ⚠ stability hit 0% — system crash
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RESULT                                                              */
/* ------------------------------------------------------------------ */

function ResultScreen({ mod, node, correctCount, total, runXp, bestStreak, crashed, onRetry, onTree }) {
  const pct = Math.round((correctCount / total) * 100);
  const stars = pct === 100 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
  const Icon = mod.icon;

  let verdict = "needs another pass";
  let verdictColor = "#f85149";
  if (crashed) { verdict = "build crashed"; verdictColor = "#f85149"; }
  else if (pct === 100) { verdict = "flawless merge"; verdictColor = "#3fb950"; }
  else if (pct >= 70) { verdict = "build passed"; verdictColor = "#3fb950"; }
  else if (pct >= 40) { verdict = "build passed with warnings"; verdictColor = "#f2cc60"; }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ ...S.panel, padding: "32px 26px", textAlign: "center", animation: "popIn .3s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon size={26} color={mod.accent} />
        </div>
        <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", letterSpacing: 1 }}>{mod.file}</div>
        <h2 style={{ ...S.display, fontSize: 21, color: "#e6edf3", margin: "4px 0 2px" }}>{node.title}</h2>
        <div style={{ ...S.mono, fontSize: 13, color: verdictColor, marginBottom: 20, fontWeight: 600 }}>{verdict}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 22 }}>
          {[0, 1, 2].map((i) => (
            <Star key={i} size={30} fill={i < stars ? "#f2cc60" : "none"} color={i < stars ? "#f2cc60" : "#232b36"} strokeWidth={1.5} />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          <StatBox label="score" value={`${correctCount}/${total}`} />
          <StatBox label="xp earned" value={`+${runXp}`} color="#f2cc60" />
          <StatBox label="best streak" value={`×${bestStreak}`} color="#56d4dd" />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onRetry} style={{ ...S.primaryBtn(mod.accent), flex: 1 }}>
            <RotateCcw size={14} /> retry
          </button>
          <button onClick={onTree} style={{ ...S.ghostBtn, flex: 1, justifyContent: "center" }}>
            skill tree
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "#c9d1d9" }) {
  return (
    <div style={{ background: "#0d1219", border: "1px solid #1f2734", borderRadius: 9, padding: "10px 6px" }}>
      <div style={{ ...S.mono, fontSize: 9.5, color: "#4b5563", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ ...S.display, fontSize: 16, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STYLE TOKENS                                                        */
/* ------------------------------------------------------------------ */

const S = {
  appShell: {
    minHeight: "100vh",
    background: "#0a0e14",
    backgroundImage:
      "radial-gradient(circle at 15% 0%, rgba(63,185,80,0.06), transparent 40%), radial-gradient(circle at 85% 15%, rgba(86,212,221,0.06), transparent 40%)",
    color: "#e6edf3",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  mono: { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', Menlo, monospace" },
  display: { fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: -0.3 },
  panel: { background: "#11161d", border: "1px solid #1f2734", borderRadius: 14 },
  card: { background: "#11161d", border: "1px solid #1f2734", borderRadius: 14, padding: "14px 16px", minWidth: 220 },
  ghostBtn: {
    fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#7d8590",
    background: "transparent", border: "1px solid #232b36", borderRadius: 8,
    padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  },
  primaryBtn: (accent) => ({
    fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "#0a0e14",
    background: accent, border: "none", borderRadius: 9, padding: "12px 16px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  }),
};