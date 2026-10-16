import random
import re
from typing import List, Dict, Any, Set, Optional, Tuple
from nltk.corpus import wordnet as wn

# Rich, comprehensive academic taxonomy categories for high-confusion, peer-level distractors
SEMANTIC_TAXONOMY = {
    "ml_models": [
        "Linear Regression", "Logistic Regression", "Support Vector Machines (SVM)",
        "Decision Trees", "Random Forest", "Gradient Boosting",
        "Naive Bayes Classifier", "K-Means Clustering", "K-Nearest Neighbors (KNN)",
        "Principal Component Analysis (PCA)", "Artificial Neural Networks (ANN)",
        "Recurrent Neural Networks (RNN)", "Convolutional Neural Networks (CNN)",
        "AdaBoost Classifier", "Extra Trees Classifier"
    ],
    "deep_learning_models": [
        "Convolutional Neural Network (CNN)", "Recurrent Neural Network (RNN)",
        "Long Short-Term Memory (LSTM)", "Transformer Model", "Autoencoder",
        "Generative Adversarial Network (GAN)", "Multi-Layer Perceptron (MLP)",
        "Gated Recurrent Unit (GRU)", "Deep Belief Network (DBN)"
    ],
    "ml_techniques": [
        "Kernel Trick", "Gradient Descent", "Backpropagation", "L2 Regularization",
        "Dropout Regularization", "K-Fold Cross-Validation", "Batch Normalization",
        "Feature Scaling", "Data Augmentation", "Early Stopping"
    ],
    "ml_metrics": [
        "Mean Squared Error (MSE)", "Mean Absolute Error (MAE)", "Root Mean Squared Error (RMSE)",
        "Classification Accuracy", "Precision Metric", "Recall Metric", "F1-Score",
        "ROC-AUC Score", "Binary Cross-Entropy Loss", "Gini Impurity", "Information Gain"
    ],
    "activation_functions": [
        "Sigmoid Activation Function", "ReLU Activation Function",
        "Softmax Activation Function", "Tanh Activation Function",
        "Leaky ReLU Function", "ELU Activation Function"
    ],
    "ai_search": [
        "Breadth-First Search (BFS)", "Depth-First Search (DFS)", "A* Search Algorithm",
        "Greedy Best-First Search", "Dijkstra's Algorithm", "Minimax Algorithm",
        "Alpha-Beta Pruning", "Hill Climbing Algorithm", "Simulated Annealing",
        "Iterative Deepening Search", "Uniform Cost Search (UCS)", "Bidirectional Search"
    ],
    "data_structures": [
        "Binary Search Tree (BST)", "AVL Tree", "Red-Black Tree", "B-Tree",
        "Adjacency Matrix", "Adjacency List", "Hash Table", "Doubly Linked List",
        "Circular Queue", "Priority Queue", "Min-Heap", "Trie Data Structure",
        "Segment Tree", "Disjoint Set Union (DSU)"
    ],
    "tree_traversals": [
        "Inorder Traversal", "Preorder Traversal", "Postorder Traversal",
        "Level Order Traversal", "Depth-First Traversal"
    ],
    "networking_protocols": [
        "Transmission Control Protocol (TCP)", "User Datagram Protocol (UDP)",
        "Internet Protocol (IP)", "Address Resolution Protocol (ARP)",
        "Domain Name System (DNS)", "Dynamic Host Configuration Protocol (DHCP)",
        "Hypertext Transfer Protocol (HTTP)", "Simple Mail Transfer Protocol (SMTP)",
        "Border Gateway Protocol (BGP)", "Routing Information Protocol (RIP)",
        "Open Shortest Path First (OSPF)", "Internet Control Message Protocol (ICMP)",
        "File Transfer Protocol (FTP)", "Secure Shell (SSH)"
    ],
    "osi_layers": [
        "Physical Layer", "Data Link Layer", "Network Layer",
        "Transport Layer", "Session Layer", "Presentation Layer", "Application Layer"
    ],
    "os_scheduling": [
        "Round Robin (RR) Scheduling", "First-Come First-Served (FCFS)",
        "Shortest Job First (SJF)", "Shortest Remaining Time First (SRTF)",
        "Priority Scheduling", "Multilevel Queue Scheduling",
        "Multilevel Feedback Queue (MLFQ)"
    ],
    "os_concurrency": [
        "Counting Semaphore", "Mutex Lock", "Spinlock Primitive",
        "Condition Variable", "Monitor Structure", "Critical Section"
    ],
    "deadlock_conditions": [
        "Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait"
    ],
    "complexity": [
        "O(1) constant time", "O(log n) logarithmic time", "O(n) linear time",
        "O(n log n) linearithmic time", "O(n^2) quadratic time", "O(2^n) exponential time"
    ],
    "cs_pioneers": [
        "John McCarthy", "Alan Turing", "Claude Shannon", "Marvin Minsky",
        "Edsger Dijkstra", "Donald Knuth", "Tim Berners-Lee", "Dennis Ritchie",
        "Ada Lovelace", "Herbert Simon", "Arthur Samuel", "Ken Thompson"
    ],
    "acronyms_net": [
        "TCP", "UDP", "IP", "ARP", "ICMP", "DNS", "DHCP", "HTTP", "BGP", "RIP", "OSPF", "FTP", "MAC"
    ],
    "acronyms_ai": [
        "BFS", "DFS", "UCS", "A*", "SVM", "ANN", "CNN", "RNN", "LSTM", "GAN", "PCA", "MSE", "MAE", "RMSE"
    ],
    "acronyms_os": [
        "FCFS", "SJF", "RR", "SRTF", "TLB", "CPU", "RAM", "FIFO", "LIFO", "LRU", "PCB"
    ],
    "linear_adjectives": [
        "linear", "non-linear", "quadratic", "polynomial", "logarithmic", "exponential"
    ],
    "learning_types": [
        "supervised", "unsupervised", "semi-supervised", "reinforcement", "self-supervised"
    ],
    "scheduling_types": [
        "preemptive", "non-preemptive", "cooperative", "priority-based"
    ],
    "network_types": [
        "connection-oriented", "connectionless", "stateless", "stateful"
    ],
    "graph_types": [
        "directed", "undirected", "weighted", "unweighted", "cyclic", "acyclic", "bipartite"
    ],
    "heuristic_props": [
        "admissible", "consistent", "monotonic", "inadmissible"
    ]
}

def clean_term_for_comparison(term: str) -> str:
    """Normalize term for similarity and duplicate checks."""
    t = term.lower().strip()
    t = re.sub(r'^(the|a|an)\s+', '', t)
    t = re.sub(r'[^a-z0-9]', '', t)
    return t

def strip_articles(term: str) -> str:
    """Remove leading articles like 'the', 'a', 'an' so all options look grammatically uniform."""
    return re.sub(r'^(the|a|an)\s+', '', term.strip(), flags=re.IGNORECASE).strip()

def is_too_similar(term1: str, term2: str) -> bool:
    """Check if two terms are identical, substrings, or excessive overlaps."""
    c1 = clean_term_for_comparison(term1)
    c2 = clean_term_for_comparison(term2)
    if not c1 or not c2:
        return False
    if c1 == c2:
        return True
    if len(c1) >= 4 and len(c2) >= 4:
        if c1 in c2 or c2 in c1:
            return True
    return False

def detect_taxonomy_category(target: str) -> Optional[str]:
    """Identify which semantic category best matches the target concept."""
    t_clean = clean_term_for_comparison(target)
    t_upper = target.strip().upper()
    t_lower = target.strip().lower()
    
    # 0. Property & Adjective categories
    if t_lower in ["linear", "non-linear", "nonlinear", "polynomial", "quadratic"]:
        return "linear_adjectives"
    if t_lower in ["supervised", "unsupervised", "semi-supervised", "reinforcement"]:
        return "learning_types"
    if t_lower in ["preemptive", "non-preemptive", "cooperative"]:
        return "scheduling_types"
    if t_lower in ["connection-oriented", "connectionless", "stateless"]:
        return "network_types"
    if t_lower in ["directed", "undirected", "weighted", "acyclic", "bipartite"]:
        return "graph_types"
    if t_lower in ["admissible", "consistent", "monotonic"]:
        return "heuristic_props"

    # 1. Acronyms
    if re.match(r'^[A-Z0-9]{2,6}$', target.strip()):
        for acr_cat in ["acronyms_net", "acronyms_ai", "acronyms_os"]:
            if t_upper in SEMANTIC_TAXONOMY[acr_cat]:
                return acr_cat
        return "acronyms_ai"

    # 2. Check keywords in target
    kw_mapping = [
        (r'\b(?:layer)\b', "osi_layers"),
        (r'\b(?:scheduling|fcfs|sjf|round robin|time quantum|convoy)\b', "os_scheduling"),
        (r'\b(?:mutex|semaphore|spinlock|critical section|synchronization)\b', "os_concurrency"),
        (r'\b(?:deadlock|preemption|mutual exclusion|circular wait)\b', "deadlock_conditions"),
        (r'\b(?:search|bfs|dfs|minimax|pruning|heuristic|dijkstra|a\*)\b', "ai_search"),
        (r'\b(?:tree|bst|avl|heap|graph|queue|stack|adjacency)\b', "data_structures"),
        (r'\b(?:traversal|inorder|preorder|postorder)\b', "tree_traversals"),
        (r'\b(?:protocol|tcp|udp|ip|arp|icmp|dns|dhcp|http|packet|routing|bgp|ospf|rip)\b', "networking_protocols"),
        (r'\b(?:cnn|rnn|lstm|transformer|autoencoder|gan|perceptron|neural network)\b', "deep_learning_models"),
        (r'\b(?:regression|svm|support vector|decision tree|random forest|boosting|classifier|clustering|k-means|knn|naive bayes)\b', "ml_models"),
        (r'\b(?:activation|sigmoid|relu|softmax|tanh)\b', "activation_functions"),
        (r'\b(?:loss|error|mse|rmse|mae|accuracy|precision|recall|f1|gini|impurity)\b', "ml_metrics"),
        (r'\b(?:kernel|gradient descent|backpropagation|regularization|dropout)\b', "ml_techniques"),
        (r'\b(?:o\(|complexity|log n|linear time|constant time)\b', "complexity"),
        (r'\b(?:mccarthy|turing|shannon|minsky|dijkstra|knuth|berners-lee|ritchie|lovelace)\b', "cs_pioneers")
    ]
    
    for pattern, cat in kw_mapping:
        if re.search(pattern, target, re.IGNORECASE):
            return cat
            
    # 3. Direct match in taxonomy items
    for cat_name, items in SEMANTIC_TAXONOMY.items():
        for item in items:
            if is_too_similar(item, target):
                return cat_name
                
    return None

def get_wordnet_distractors(target_word: str, max_count: int = 5) -> List[str]:
    """Extract coordinate terms (sister terms under the same hypernym) via WordNet."""
    clean_target = clean_term_for_comparison(target_word)
    distractors = set()
    
    words_to_try = [target_word.lower().strip()]
    tokens = target_word.lower().strip().split()
    if len(tokens) > 1:
        words_to_try.append(tokens[-1]) # head noun
        
    for word in words_to_try:
        synsets = wn.synsets(word)
        for syn in synsets[:3]:
            for hypernym in syn.hypernyms()[:2]:
                for hyponym in hypernym.hyponyms()[:12]:
                    for lemma in hyponym.lemmas():
                        candidate = lemma.name().replace('_', ' ').strip()
                        if not is_too_similar(candidate, target_word) and len(candidate) > 2:
                            # Avoid radically different lengths
                            if abs(len(candidate.split()) - len(tokens)) <= 2:
                                distractors.add(candidate.title() if target_word.istitle() else candidate)
                                if len(distractors) >= max_count:
                                    return list(distractors)
                                
    return list(distractors)

def get_peer_document_distractors(
    target: str,
    doc_concepts: Dict[str, Any],
    max_count: int = 6
) -> List[str]:
    """
    Extract strictly peer-level concepts from the document.
    Must match the target's word count range and syntactic type.
    """
    distractors = []
    seen = {clean_term_for_comparison(target)}
    target_clean = strip_articles(target)
    target_words = len(target_clean.split())
    is_acronym = bool(re.match(r'^[A-Z0-9]{2,6}$', target_clean))

    if is_acronym and "acronyms" in doc_concepts:
        for acr in doc_concepts["acronyms"]:
            term = acr["text"]
            c = clean_term_for_comparison(term)
            if c not in seen and not is_too_similar(term, target):
                seen.add(c)
                distractors.append(term)

    # Check named entities if target is an entity
    if "named_entities" in doc_concepts:
        for ent in doc_concepts["named_entities"]:
            term = strip_articles(ent["text"])
            c = clean_term_for_comparison(term)
            if c not in seen and not is_too_similar(term, target):
                # Only keep if word count is similar
                if abs(len(term.split()) - target_words) <= 1:
                    seen.add(c)
                    distractors.append(term)

    # Check noun chunks that share similar length and capitalized structure
    if "noun_chunks" in doc_concepts:
        for chunk in doc_concepts["noun_chunks"]:
            term = strip_articles(chunk["text"])
            c = clean_term_for_comparison(term)
            if c not in seen and not is_too_similar(term, target):
                # Must be comparable in word count (within 1 word difference)
                chunk_len = len(term.split())
                if abs(chunk_len - target_words) <= 1:
                    # If target is Title Case, require candidate to look like a proper term
                    if target[0].isupper() and not term[0].isupper():
                        term = term.title()
                    seen.add(c)
                    distractors.append(term)
                    
    return distractors

def generate_distractors(
    target_answer: str,
    doc_concepts: Dict[str, Any],
    num_distractors: int = 3
) -> List[str]:
    """
    Produce a verified, high-confusion, peer-matched set of distractors.
    Prioritizes semantic peers that are structurally indistinguishable from the correct answer.
    """
    clean_target = strip_articles(target_answer)
    selected_distractors: List[str] = []
    seen = {clean_term_for_comparison(clean_target)}
    
    # 1. Detect Category Taxonomy first (creates the highest confusion and peer plausibility!)
    best_cat = detect_taxonomy_category(clean_target)
    if best_cat and best_cat in SEMANTIC_TAXONOMY:
        peer_pool = [
            item for item in SEMANTIC_TAXONOMY[best_cat]
            if clean_term_for_comparison(item) not in seen and not is_too_similar(item, clean_target)
        ]
        random.shuffle(peer_pool)
        for p in peer_pool:
            seen.add(clean_term_for_comparison(p))
            selected_distractors.append(p)
            if len(selected_distractors) >= num_distractors:
                break

    # 2. Peer Document Concepts (if more needed)
    if len(selected_distractors) < num_distractors:
        doc_candidates = get_peer_document_distractors(clean_target, doc_concepts)
        random.shuffle(doc_candidates)
        for cand in doc_candidates:
            c = clean_term_for_comparison(cand)
            if c not in seen and not is_too_similar(cand, clean_target):
                seen.add(c)
                selected_distractors.append(cand)
                if len(selected_distractors) >= num_distractors:
                    break

    # 3. WordNet Coordinate Terms
    if len(selected_distractors) < num_distractors:
        wn_candidates = get_wordnet_distractors(clean_target)
        random.shuffle(wn_candidates)
        for cand in wn_candidates:
            c = clean_term_for_comparison(cand)
            if c not in seen and not is_too_similar(cand, clean_target):
                seen.add(c)
                selected_distractors.append(cand)
                if len(selected_distractors) >= num_distractors:
                    break

    # 4. Synthesize plausible morphological variants of the exact same semantic head
    if len(selected_distractors) < num_distractors:
        words = clean_target.split()
        head_noun = words[-1] if words else clean_target
        prefixes = ["Dynamic", "Hierarchical", "Iterative", "Stochastic", "Generalized", "Adaptive"]
        for pfx in prefixes:
            if len(selected_distractors) >= num_distractors:
                break
            synth = f"{pfx} {head_noun}".title()
            c = clean_term_for_comparison(synth)
            if c not in seen:
                seen.add(c)
                selected_distractors.append(synth)

    # 5. Format casing and ensure NO articles stick out
    formatted = []
    for d in selected_distractors[:num_distractors]:
        d_clean = strip_articles(d)
        if clean_target.isupper() and len(clean_target) <= 6:
            d_clean = d_clean.upper()
        elif clean_target.istitle() or (clean_target[0].isupper() and not clean_target.isupper()):
            d_clean = d_clean.title()
        formatted.append(d_clean)
        
    return formatted

def assemble_options(
    correct_answer: str,
    distractors: List[str],
    num_options: int = 4
) -> Tuple[List[str], int]:
    """
    Assemble the list of options, ensuring correct answer has no giveaway articles,
    options are distinct, and position is randomly shuffled.
    """
    clean_answer = strip_articles(correct_answer)
    clean_distractors = [strip_articles(d) for d in distractors]
    
    # Ensure all options are distinct
    seen = {clean_term_for_comparison(clean_answer)}
    unique_distractors = []
    for d in clean_distractors:
        c = clean_term_for_comparison(d)
        if c not in seen:
            seen.add(c)
            unique_distractors.append(d)
            
    needed = num_options - 1
    options = [clean_answer] + unique_distractors[:needed]
    
    # If still short of num_options, add high-quality synthetic variants
    head = clean_answer.split()[-1] if clean_answer.split() else "Model"
    sub_prefixes = ["Recursive", "Distributed", "Sequential", "Approximate"]
    for pfx in sub_prefixes:
        if len(options) >= num_options:
            break
        cand = f"{pfx} {head}".title()
        if clean_term_for_comparison(cand) not in seen:
            seen.add(clean_term_for_comparison(cand))
            options.append(cand)

    # Shuffle options randomly
    random.shuffle(options)
    correct_index = options.index(clean_answer)
    return options, correct_index
