SAMPLE_TEXTS = {
    "Artificial Intelligence": {
        "title": "Introduction to Artificial Intelligence and Search Algorithms",
        "subject": "Artificial Intelligence",
        "topic": "Search Strategies and Heuristics",
        "text": """Artificial Intelligence (AI) is the simulation of human intelligence processes by computer systems. These processes include learning, reasoning, problem-solving, perception, and language understanding. John McCarthy coined the term Artificial Intelligence in 1956 during the Dartmouth Conference. 

Search algorithms form the cornerstone of classical AI problem solving. An uninformed search algorithm, also known as blind search, explores the search space without domain-specific knowledge beyond the problem definition. Breadth-First Search (BFS) is an uninformed search algorithm that expands the shallowest nodes first using a FIFO queue. BFS is complete and optimal when step costs are identical. In contrast, Depth-First Search (DFS) explores the deepest unexpanded node using a LIFO stack. DFS has lower memory requirements than BFS, but it is neither complete in infinite state spaces nor optimal.

Informed search algorithms utilize heuristic evaluation functions to estimate the cost of reaching the goal. The A* search algorithm is a widely used heuristic search algorithm that computes f(n) = g(n) + h(n), where g(n) is the exact cost from the start node to node n, and h(n) is the estimated cost from node n to the goal. When the heuristic function is admissible, meaning it never overestimates the true cost, A* search is guaranteed to be optimal. Consistent heuristics ensure that the estimated cost between adjacent nodes satisfies the triangle inequality.

Adversarial search applies to competitive multi-agent environments such as chess and checkers. The Minimax algorithm evaluates game trees by assuming optimal play from both the maximizing player and the minimizing opponent. Alpha-Beta Pruning is an optimization technique for Minimax that eliminates branches that cannot influence the final decision. Alpha-Beta pruning significantly reduces the branching factor, allowing search algorithms to evaluate deeper levels within the same time limit."""
    },
    "Machine Learning": {
        "title": "Supervised Learning, Regression, and Classification Foundations",
        "subject": "Machine Learning",
        "topic": "Supervised Learning Models",
        "text": """Machine learning is a subfield of artificial intelligence focused on building systems that learn patterns from data rather than following explicit rules. Supervised learning algorithms learn a mapping function from input variables to continuous or discrete output labels using labeled training datasets. 

Linear Regression is a fundamental supervised algorithm used to model the relationship between a dependent target variable and one or more independent explanatory features. The algorithm minimizes the Mean Squared Error (MSE) cost function using optimization techniques such as Ordinary Least Squares or Gradient Descent. Logistic Regression is a classification algorithm that applies the sigmoid activation function to map linear outputs into probabilities bounded between 0 and 1.

Support Vector Machines (SVM) are supervised classification models that identify the optimal hyperplane maximizing the geometric margin between distinct classes. Support vectors represent the critical data points closest to the decision boundary. When datasets are not linearly separable, SVM applies the kernel trick to map input vectors into higher-dimensional feature spaces where linear separation becomes feasible. Common kernel functions include the Radial Basis Function (RBF) and polynomial kernels.

Decision Trees partition feature space recursively based on criteria like Information Gain or Gini Impurity. While decision trees offer high interpretability, individual trees often suffer from high variance and overfitting. Ensemble learning methods combine multiple base models to improve predictive generalization. Random Forest is an ensemble bagging method that builds multiple de-correlated decision trees on bootstrap samples of the training data. Gradient Boosting builds trees sequentially, where each successive estimator corrects the residual errors produced by preceding trees."""
    },
    "Computer Networks": {
        "title": "The OSI Model, TCP/IP Suite, and Transport Protocols",
        "subject": "Computer Networks",
        "topic": "Transport and Network Layer Protocols",
        "text": """Computer networking enables interconnected computing devices to exchange data and share shared resources. The Open Systems Interconnection (OSI) reference model organizes network communications into seven conceptual layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.

The Network Layer is responsible for logical addressing and packet routing across heterogeneous networks. The Internet Protocol (IP) operates at this layer to encapsulate data into IP packets and direct them to their destinations. IPv4 addresses consist of 32 bits represented in dotted-decimal format, whereas IPv6 addresses comprise 128 bits expressed in hexadecimal notation to resolve address exhaustion. The Address Resolution Protocol (ARP) resolves logical IP addresses into physical MAC addresses within a local area network.

The Transport Layer manages end-to-end communication between application processes running on distinct hosts. The Transmission Control Protocol (TCP) is a connection-oriented, reliable transport protocol that implements a three-way handshake (SYN, SYN-ACK, ACK) to establish connections before transmitting data. TCP guarantees ordered packet delivery, error detection, flow control via sliding windows, and congestion control algorithms such as slow start. 

In contrast, the User Datagram Protocol (UDP) is a connectionless, lightweight transport protocol that transmits datagrams without establishing prior sessions. UDP provides minimal overhead and does not guarantee packet arrival or sequence order. UDP is optimal for real-time applications such as video streaming, online gaming, and Voice over IP (VoIP), where low latency is more critical than error-free delivery."""
    },
    "Operating Systems": {
        "title": "Process Scheduling, Concurrency, and Deadlock Management",
        "subject": "Operating Systems",
        "topic": "Processes and Synchronization",
        "text": """An operating system serves as an intermediary intermediary between computer hardware and user applications, managing system hardware resources efficiently. A process is an instance of a computer program in execution, consisting of program code, program counter, registers, call stack, and heap memory.

CPU scheduling determines which ready process is allocated CPU execution time. Preemptive scheduling allows the operating system to interrupt a currently executing process to assign the CPU to a higher-priority task. Round Robin (RR) is a preemptive scheduling algorithm that assigns each process a fixed time slice known as a time quantum. First-Come First-Served (FCFS) is a non-preemptive scheduling policy that can cause the convoy effect, where short processes wait behind long CPU-bound tasks. Shortest Job First (SJF) minimizes average waiting time but requires prior knowledge of process execution bursts.

Process synchronization coordinates concurrent execution to prevent race conditions when multiple processes access shared memory locations. A critical section refers to code segments that access shared resources. Mutual exclusion ensures that only one process executes within its critical section at any given moment. Semaphores and mutex locks are synchronization primitives designed to enforce mutual exclusion.

A deadlock occurs when a set of concurrent processes are permanently blocked because each process holds a resource while waiting for another resource held by another process. Four Coffman conditions must hold simultaneously for a deadlock to arise: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. The Banker's Algorithm is a classic deadlock avoidance strategy that checks system state safety before granting resource requests."""
    },
    "Data Structures": {
        "title": "Trees, Binary Search Trees, and Graph Representation",
        "subject": "Data Structures",
        "topic": "Tree and Graph Structures",
        "text": """A data structure is a specialized format for organizing, processing, retrieving, and storing data efficiently. Linear data structures like arrays and linked lists store elements sequentially, while hierarchical data structures represent parent-child relationships.

A Binary Search Tree (BST) is a node-based binary tree data structure where each node stores a key. The key in any node is strictly greater than all keys in its left subtree and strictly less than all keys in its right subtree. In an optimally balanced BST, searching, insertion, and deletion operations execute in O(log n) logarithmic time complexity. However, if keys are inserted in sorted order, the BST degenerates into a linear linked list with O(n) worst-case time complexity.

Self-balancing binary search trees overcome this degradation by automatically rebalancing after insertions and deletions. An AVL tree maintains balance by ensuring that the heights of two sibling subtrees never differ by more than one. Red-Black trees enforce balance using node coloring rules (red or black) and tree rotations, providing faster insertion and deletion performance than AVL trees.

A Graph is a non-linear data structure consisting of a set of vertices (nodes) connected by edges. Graphs can be directed or undirected, weighted or unweighted. Two primary data structures for representing graphs are the Adjacency Matrix and the Adjacency List. An adjacency matrix requires O(V^2) memory space and allows O(1) edge lookup, making it suitable for dense graphs. An adjacency list uses O(V + E) memory space, making it efficient for sparse graphs. Graph traversal algorithms include Breadth-First Search (BFS) for shortest path calculations on unweighted graphs and Depth-First Search (DFS) for topological sorting and cycle detection."""
    }
}
