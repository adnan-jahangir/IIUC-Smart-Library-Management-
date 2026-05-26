require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library-system';

const booksData = [
    { "customId": "CSE-01", "title": "Introduction to Algorithms", "author": "Thomas H. Cormen", "department": "CSE", "isbn": "978-0262033848", "edition": "3rd", "copies": 5, "image": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400" },
    { "customId": "CSE-02", "title": "Clean Code", "author": "Robert C. Martin", "department": "CSE", "isbn": "978-0132350884", "edition": "1st", "copies": 8, "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400" },
    { "customId": "CSE-03", "title": "Computer Networking", "author": "James Kurose", "department": "CSE", "isbn": "978-0132856201", "edition": "6th", "copies": 4, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "CSE-04", "title": "Operating System Concepts", "author": "Abraham Silberschatz", "department": "CSE", "isbn": "978-1118063330", "edition": "9th", "copies": 6, "image": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=400" },
    { "customId": "CSE-05", "title": "Database System Concepts", "author": "Avi Silberschatz", "department": "CSE", "isbn": "978-0073523323", "edition": "6th", "copies": 5, "image": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400" },
    { "customId": "CSE-06", "title": "Design Patterns", "author": "Erich Gamma", "department": "CSE", "isbn": "978-0201633610", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400" },
    { "customId": "CSE-07", "title": "Artificial Intelligence: A Modern Approach", "author": "Stuart Russell", "department": "CSE", "isbn": "978-0136042594", "edition": "3rd", "copies": 3, "image": "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400" },
    { "customId": "CSE-08", "title": "Compilers: Principles, Techniques, and Tools", "author": "Alfred V. Aho", "department": "CSE", "isbn": "978-0321486813", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400" },
    { "customId": "CSE-09", "title": "Computer Architecture: A Quantitative Approach", "author": "John L. Hennessy", "department": "CSE", "isbn": "978-0123838728", "edition": "5th", "copies": 5, "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400" },
    { "customId": "CSE-10", "title": "The C Programming Language", "author": "Brian W. Kernighan", "department": "CSE", "isbn": "978-0131103627", "edition": "2nd", "copies": 12, "image": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400" },
    { "customId": "CSE-11", "title": "Introduction to the Theory of Computation", "author": "Michael Sipser", "department": "CSE", "isbn": "978-1133187790", "edition": "3rd", "copies": 4, "image": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400" },
    { "customId": "CSE-12", "title": "Software Engineering", "author": "Ian Sommerville", "department": "CSE", "isbn": "978-0133943030", "edition": "10th", "copies": 6, "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400" },
    { "customId": "CSE-13", "title": "Data Structures and Algorithm Analysis in C++", "author": "Mark Allen Weiss", "department": "CSE", "isbn": "978-0132847377", "edition": "4th", "copies": 7, "image": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400" },
    { "customId": "CSE-14", "title": "Computer Graphics: Principles and Practice", "author": "John F. Hughes", "department": "CSE", "isbn": "978-0321399526", "edition": "3rd", "copies": 2, "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400" },
    { "customId": "CSE-15", "title": "Discrete Mathematics and Its Applications", "author": "Kenneth H. Rosen", "department": "CSE", "isbn": "978-0073383095", "edition": "7th", "copies": 10, "image": "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400" },
    { "customId": "CSE-16", "title": "Python Crash Course", "author": "Eric Matthes", "department": "CSE", "isbn": "978-1593276034", "edition": "1st", "copies": 9, "image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400" },
    { "customId": "CSE-17", "title": "The Pragmatic Programmer", "author": "Andrew Hunt", "department": "CSE", "isbn": "978-0135957059", "edition": "20th Anniv.", "copies": 5, "image": "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=400" },
    { "customId": "CSE-18", "title": "Head First Design Patterns", "author": "Eric Freeman", "department": "CSE", "isbn": "978-0596007126", "edition": "1st", "copies": 6, "image": "https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=400" },
    { "customId": "CSE-19", "title": "Distributed Systems: Principles and Paradigms", "author": "Andrew S. Tanenbaum", "department": "CSE", "isbn": "978-0132392273", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400" },
    { "customId": "CSE-20", "title": "Cryptography and Network Security", "author": "William Stallings", "department": "CSE", "isbn": "978-0134444611", "edition": "7th", "copies": 5, "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400" },

    { "customId": "EEE-01", "title": "Fundamentals of Electric Circuits", "author": "Charles K. Alexander", "department": "EEE", "isbn": "978-0073380575", "edition": "5th", "copies": 6, "image": "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?w=400" },
    { "customId": "EEE-02", "title": "Microelectronic Circuits", "author": "Adel S. Sedra", "department": "EEE", "isbn": "978-0199339136", "edition": "7th", "copies": 5, "image": "https://images.unsplash.com/photo-1517055720413-77a19a483567?w=400" },
    { "customId": "EEE-03", "title": "Electric Machinery Fundamentals", "author": "Stephen J. Chapman", "department": "EEE", "isbn": "978-0073529547", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400" },
    { "customId": "EEE-04", "title": "Control Systems Engineering", "author": "Norman S. Nise", "department": "EEE", "isbn": "978-1118170519", "edition": "6th", "copies": 5, "image": "https://images.unsplash.com/photo-1531746790731-6c2079ee777b?w=400" },
    { "customId": "EEE-05", "title": "Power System Analysis and Design", "author": "J. Duncan Glover", "department": "EEE", "isbn": "978-1111425777", "edition": "5th", "copies": 3, "image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400" },
    { "customId": "EEE-06", "title": "Principles of Electromagnetics", "author": "Matthew N.O. Sadiku", "department": "EEE", "isbn": "978-0199461851", "edition": "6th", "copies": 4, "image": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400" },
    { "customId": "EEE-07", "title": "Digital Design", "author": "M. Morris Mano", "department": "EEE", "isbn": "978-0132774208", "edition": "5th", "copies": 7, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "EEE-08", "title": "Power Electronics: Converters, Applications", "author": "Ned Mohan", "department": "EEE", "isbn": "978-0471226932", "edition": "3rd", "copies": 4, "image": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400" },
    { "customId": "EEE-09", "title": "Signals and Systems", "author": "Alan V. Oppenheim", "department": "EEE", "isbn": "978-0138147570", "edition": "2nd", "copies": 6, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "EEE-10", "title": "Modern Control Engineering", "author": "Katsuhiko Ogata", "department": "EEE", "isbn": "978-0136156734", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400" },
    { "customId": "EEE-11", "title": "Electronic Devices and Circuit Theory", "author": "Robert L. Boylestad", "department": "EEE", "isbn": "978-0132622264", "edition": "11th", "copies": 8, "image": "https://images.unsplash.com/photo-1517055720413-77a19a483567?w=400" },
    { "customId": "EEE-12", "title": "Introductory Circuit Analysis", "author": "Robert L. Boylestad", "department": "EEE", "isbn": "978-0133923605", "edition": "13th", "copies": 7, "image": "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?w=400" },
    { "customId": "EEE-13", "title": "Renewable and Efficient Electric Power Systems", "author": "Gilbert M. Masters", "department": "EEE", "isbn": "978-1118140628", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400" },
    { "customId": "EEE-14", "title": "Electrical Power Systems", "author": "C.L. Wadhwa", "department": "EEE", "isbn": "978-8122438758", "edition": "6th", "copies": 5, "image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400" },
    { "customId": "EEE-15", "title": "High Voltage Engineering", "author": "M.S. Naidu", "department": "EEE", "isbn": "978-1259062896", "edition": "5th", "copies": 2, "image": "https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=400" },
    { "customId": "EEE-16", "title": "Electrical Machines, Drives, and Power Systems", "author": "Theodore Wildi", "department": "EEE", "isbn": "978-0131776913", "edition": "6th", "copies": 4, "image": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400" },
    { "customId": "EEE-17", "title": "Digital Signal Processing", "author": "John G. Proakis", "department": "EEE", "isbn": "978-0131873742", "edition": "4th", "copies": 5, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "EEE-18", "title": "Solid State Electronic Devices", "author": "Ben G. Streetman", "department": "EEE", "isbn": "978-0133356038", "edition": "7th", "copies": 3, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "EEE-19", "title": "CMOS VLSI Design", "author": "Neil Weste", "department": "EEE", "isbn": "978-0321547743", "edition": "4th", "copies": 3, "image": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400" },
    { "customId": "EEE-20", "title": "Electric Power Substation Engineering", "author": "John D. McDonald", "department": "EEE", "isbn": "978-1439856383", "edition": "3rd", "copies": 2, "image": "https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=400" },

    { "customId": "ETE-01", "title": "Principles of Electronic Communication Systems", "author": "Louis E. Frenzel", "department": "ETE", "isbn": "978-0073373850", "edition": "4th", "copies": 5, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "ETE-02", "title": "Communication Systems", "author": "Simon Haykin", "department": "ETE", "isbn": "978-0471697909", "edition": "5th", "copies": 6, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "ETE-03", "title": "Wireless Communications", "author": "Theodore S. Rappaport", "department": "ETE", "isbn": "978-0130422323", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "ETE-04", "title": "Digital Communications", "author": "John G. Proakis", "department": "ETE", "isbn": "978-0072957167", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "ETE-05", "title": "Modern Digital and Analog Communication Systems", "author": "B.P. Lathi", "department": "ETE", "isbn": "978-0190214098", "edition": "4th", "copies": 5, "image": "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?w=400" },
    { "customId": "ETE-06", "title": "Optical Fiber Communications", "author": "Gerd Keiser", "department": "ETE", "isbn": "978-0073380711", "edition": "5th", "copies": 3, "image": "https://images.unsplash.com/photo-1601524909162-be87252be298?w=400" },
    { "customId": "ETE-07", "title": "Satellite Communications", "author": "Dennis Roddy", "department": "ETE", "isbn": "978-0071462983", "edition": "4th", "copies": 3, "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400" },
    { "customId": "ETE-08", "title": "Antennas and Wave Propagation", "author": "John D. Kraus", "department": "ETE", "isbn": "978-0070601857", "edition": "4th", "copies": 4, "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400" },
    { "customId": "ETE-09", "title": "Microwave Engineering", "author": "David M. Pozar", "department": "ETE", "isbn": "978-0470631553", "edition": "4th", "copies": 3, "image": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400" },
    { "customId": "ETE-10", "title": "Mobile Cellular Telecommunications", "author": "William C.Y. Lee", "department": "ETE", "isbn": "978-0070370470", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "ETE-11", "title": "Broadband Bands and Network Communication", "author": "Abe Nisansala", "department": "ETE", "isbn": "978-3319451241", "edition": "1st", "copies": 2, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "ETE-12", "title": "Telecommunication Switching Systems and Networks", "author": "Thiagarajan Viswanathan", "department": "ETE", "isbn": "978-8120347137", "edition": "2nd", "copies": 5, "image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400" },
    { "customId": "ETE-13", "title": "Introduction to Telecommunications", "author": "Martha Rosengrant", "department": "ETE", "isbn": "978-1418011345", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "ETE-14", "title": "Data and Computer Communications", "author": "William Stallings", "department": "ETE", "isbn": "978-0131392052", "edition": "9th", "copies": 6, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "ETE-15", "title": "Fundamentals of Wireless Communication", "author": "David Tse", "department": "ETE", "isbn": "978-0521845274", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "ETE-16", "title": "Error Control Coding", "author": "Lin Shu", "department": "ETE", "isbn": "978-0130426727", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400" },
    { "customId": "ETE-17", "title": "RF Microelectronics", "author": "Behzad Razavi", "department": "ETE", "isbn": "978-0137134731", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400" },
    { "customId": "ETE-18", "title": "Next Generation Wireless Systems", "author": "James Asiri", "department": "ETE", "isbn": "978-1119125432", "edition": "1st", "copies": 2, "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400" },
    { "customId": "ETE-19", "title": "Information Theory and Reliable Communication", "author": "Robert G. Gallager", "department": "ETE", "isbn": "978-0471290483", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400" },
    { "customId": "ETE-20", "title": "Fundamentals of Radar Signal Processing", "author": "Mark A. Richards", "department": "ETE", "isbn": "978-0071432443", "edition": "1st", "copies": 2, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },

    { "customId": "CCE-01", "title": "Computer Networks and Internets", "author": "Douglas E. Comer", "department": "CCE", "isbn": "978-0133587937", "edition": "6th", "copies": 5, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "CCE-02", "title": "Network Security Essentials", "author": "William Stallings", "department": "CCE", "isbn": "978-0133370430", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400" },
    { "customId": "CCE-03", "title": "Cloud Computing: Concepts, Technology", "author": "Thomas Erl", "department": "CCE", "isbn": "978-0133387520", "edition": "1st", "copies": 6, "image": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400" },
    { "customId": "CCE-04", "title": "Communication Networks", "author": "Alberto Leon-Garcia", "department": "CCE", "isbn": "978-0072346978", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "CCE-05", "title": "Network Algorithmicics", "author": "George Varghese", "department": "CCE", "isbn": "978-0127145013", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400" },
    { "customId": "CCE-06", "title": "TCP/IP Illustrated, Volume 1", "author": "Kevin R. Fall", "department": "CCE", "isbn": "978-0321336316", "edition": "2nd", "copies": 5, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "CCE-07", "title": "Network Routing: Algorithms and Architectures", "author": "Deep Medhi", "department": "CCE", "isbn": "978-0123744241", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400" },
    { "customId": "CCE-08", "title": "Wireless Network Evolution", "author": "Vijay Garg", "department": "CCE", "isbn": "978-0130280770", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "CCE-09", "title": "Internet Security: Cryptographic Principles", "author": "Man Young Rhee", "department": "CCE", "isbn": "978-0470852859", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400" },
    { "customId": "CCE-10", "title": "Cybersecurity Essentials", "author": "Charles J. Brooks", "department": "CCE", "isbn": "978-1119362395", "edition": "1st", "copies": 7, "image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400" },
    { "customId": "CCE-11", "title": "Introduction to Wireless and Mobile Systems", "author": "Dharma P. Agrawal", "department": "CCE", "isbn": "978-1305087132", "edition": "4th", "copies": 4, "image": "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400" },
    { "customId": "CCE-12", "title": "Mobile Ad Hoc Networking", "author": "Stefano Basagni", "department": "CCE", "isbn": "978-1118087473", "edition": "2nd", "copies": 2, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "CCE-13", "title": "Software Defined Networks", "author": "Paul Goransson", "department": "CCE", "isbn": "978-0128045558", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400" },
    { "customId": "CCE-14", "title": "High-Performance Communication Networks", "author": "Jean Walrand", "department": "CCE", "isbn": "978-1558605749", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" },
    { "customId": "CCE-15", "title": "Data Networks", "author": "Dimitri Bertsekas", "department": "CCE", "isbn": "978-0132009164", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { "customId": "CCE-16", "title": "Ethical Hacking and Network Defense", "author": "Michael T. Simpson", "department": "CCE", "isbn": "978-1111135836", "edition": "2nd", "copies": 5, "image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400" },
    { "customId": "CCE-17", "title": "Network Management: Principles", "author": "Mani Subramanian", "department": "CCE", "isbn": "978-8131727591", "edition": "2nd", "copies": 3, "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400" },
    { "customId": "CCE-18", "title": "Next-Generation Internet Architectures", "author": "Sajal K. Das", "department": "CCE", "isbn": "978-0471415237", "edition": "1st", "copies": 2, "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400" },
    { "customId": "CCE-19", "title": "Cloud Security and Privacy", "author": "Tim Mather", "department": "CCE", "isbn": "978-0596802769", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400" },
    { "customId": "CCE-20", "title": "Principles of Cyber-Physical Systems", "author": "Rajeev Alur", "department": "CCE", "isbn": "978-0262029117", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400" },

    { "customId": "CIVIL-01", "title": "Structural Analysis", "author": "Russell C. Hibbeler", "department": "CIVIL", "isbn": "978-0133942842", "edition": "9th", "copies": 6, "image": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400" },
    { "customId": "CIVIL-02", "title": "Design of Reinforced Concrete", "author": "Jack C. McCormac", "department": "CIVIL", "isbn": "978-1118879108", "edition": "9th", "copies": 5, "image": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400" },
    { "customId": "CIVIL-03", "title": "Principles of Geotechnical Engineering", "author": "Braja M. Das", "department": "CIVIL", "isbn": "978-1133108665", "edition": "8th", "copies": 5, "image": "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=400" },
    { "customId": "CIVIL-04", "title": "Fluid Mechanics with Engineering Applications", "author": "E. John Finnemore", "department": "CIVIL", "isbn": "978-0072432022", "edition": "10th", "copies": 4, "image": "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=400" },
    { "customId": "CIVIL-05", "title": "Surveying: Principles and Applications", "author": "Barry F. Kavanagh", "department": "CIVIL", "isbn": "978-0132365123", "edition": "8th", "copies": 7, "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400" },
    { "customId": "CIVIL-06", "title": "Transportation Engineering: An Introduction", "author": "C. Jotin Khisty", "department": "CIVIL", "isbn": "978-0130891730", "edition": "3rd", "copies": 4, "image": "https://images.unsplash.com/photo-1547496502-affa22d38842?w=400" },
    { "customId": "CIVIL-07", "title": "Environmental Engineering: Principles and Practice", "author": "Richard O. Mines", "department": "CIVIL", "isbn": "978-1118801451", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400" },
    { "customId": "CIVIL-08", "title": "Steel Design", "author": "William T. Segui", "department": "CIVIL", "isbn": "978-1111576004", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400" },
    { "customId": "CIVIL-09", "title": "Foundation Analysis and Design", "author": "Joseph E. Bowles", "department": "CIVIL", "isbn": "978-0079122477", "edition": "5th", "copies": 3, "image": "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=400" },
    { "customId": "CIVIL-10", "title": "Water Resources Engineering", "author": "Larry W. Mays", "department": "CIVIL", "isbn": "978-0470460641", "edition": "2nd", "copies": 4, "image": "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=400" },
    { "customId": "CIVIL-11", "title": "Construction Planning, Equipment, and Methods", "author": "Robert L. Peurifoy", "department": "CIVIL", "isbn": "978-0073401126", "edition": "8th", "copies": 5, "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400" },
    { "customId": "CIVIL-12", "title": "Mechanics of Materials", "author": "Ferdinand P. Beer", "department": "CIVIL", "isbn": "978-0073398235", "edition": "6th", "copies": 8, "image": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400" },
    { "customId": "CIVIL-13", "title": "Wastewater Engineering: Treatment and Reuse", "author": "Metcalf & Eddy", "department": "CIVIL", "isbn": "978-0071241403", "edition": "4th", "copies": 3, "image": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400" },
    { "customId": "CIVIL-14", "title": "Hydrology and Floodplain Analysis", "author": "Philip B. Bedient", "department": "CIVIL", "isbn": "978-0132567961", "edition": "5th", "copies": 3, "image": "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=400" },
    { "customId": "CIVIL-15", "title": "Bridge Engineering: Design and Construction", "author": "Wai-Fah Chen", "department": "CIVIL", "isbn": "978-1439810293", "edition": "2nd", "copies": 2, "image": "https://images.unsplash.com/photo-1545558014-8687977e99a5?w=400" },
    { "customId": "CIVIL-16", "title": "Engineering Mechanics: Statics", "author": "J.L. Meriam", "department": "CIVIL", "isbn": "978-1118164990", "edition": "7th", "copies": 6, "image": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400" },
    { "customId": "CIVIL-17", "title": "Project Management for Construction", "author": "Chris Hendrickson", "department": "CIVIL", "isbn": "978-0137312665", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400" },
    { "customId": "CIVIL-18", "title": "Traffic Engineering", "author": "Roger P. Roess", "department": "CIVIL", "isbn": "978-0136135739", "edition": "4th", "copies": 3, "image": "https://images.unsplash.com/photo-1547496502-affa22d38842?w=400" },
    { "customId": "CIVIL-19", "title": "Prestressed Concrete", "author": "Edward G. Nawy", "department": "CIVIL", "isbn": "978-0136075912", "edition": "5th", "copies": 3, "image": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400" },
    { "customId": "CIVIL-20", "title": "Matrix Structural Analysis", "author": "William McGuire", "department": "CIVIL", "isbn": "978-0471129189", "edition": "2nd", "copies": 2, "image": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400" }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Starting database seed...');
    
    try {
      // Clear existing books to prevent duplicates during multiple runs
      await Book.deleteMany({});
      console.log('Cleared existing books from the collection.');
      
      // Insert new books
      const mappedBooks = booksData.map(book => ({
        ...book,
        totalCopies: book.copies,
        availableCopies: book.copies
      }));
      await Book.insertMany(mappedBooks);
      console.log(`Successfully seeded ${mappedBooks.length} books into the database!`);
      
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      // Close the connection
      mongoose.disconnect();
      console.log('MongoDB connection closed.');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
