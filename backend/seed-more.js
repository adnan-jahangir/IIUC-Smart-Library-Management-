require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library-system';

const moreBooksData = [
    { "customId": "PHARM-01", "title": "Trease and Evans Pharmacognosy", "author": "William Charles Evans", "department": "Pharmacy", "isbn": "978-0702033889", "edition": "16th", "copies": 4, "image": "https://images.unsplash.com/photo-1587854692152-cbe660dbbc88?w=400" },
    { "customId": "PHARM-02", "title": "Martin's Physical Pharmacy and Pharmaceutical Sciences", "author": "Patrick J. Sinko", "department": "Pharmacy", "isbn": "978-1451191455", "edition": "7th", "copies": 5, "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400" },
    { "customId": "PHARM-03", "title": "Goodman and Gilman's The Pharmacological Basis of Therapeutics", "author": "Laurence Brunton", "department": "Pharmacy", "isbn": "978-1259584732", "edition": "13th", "copies": 3, "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
    { "customId": "PHARM-04", "title": "Ansel's Pharmaceutical Dosage Forms and Drug Delivery Systems", "author": "Loyd V. Allen", "department": "Pharmacy", "isbn": "978-1451192148", "edition": "10th", "copies": 6, "image": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400" },
    { "customId": "PHARM-05", "title": "Remington: The Science and Practice of Pharmacy", "author": "Adeboye Adejare", "department": "Pharmacy", "isbn": "978-0128200070", "edition": "23rd", "copies": 2, "image": "https://images.unsplash.com/photo-1587854692152-cbe660dbbc88?w=400" },
    { "customId": "PHARM-06", "title": "Foye's Principles of Medicinal Chemistry", "author": "Thomas L. Lemke", "department": "Pharmacy", "isbn": "978-1609133450", "edition": "7th", "copies": 4, "image": "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?w=400" },
    { "customId": "PHARM-07", "title": "Pharmaceutical Biotechnology: Fundamentals and Applications", "author": "Daan J.A. Crommelin", "department": "Pharmacy", "isbn": "978-3030007096", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400" },
    { "customId": "PHARM-08", "title": "Cooper and Gunn's Dispensing for Pharmaceutical Students", "author": "S.J. Carter", "department": "Pharmacy", "isbn": "978-8123906134", "edition": "12th", "copies": 8, "image": "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400" },
    { "customId": "PHARM-09", "title": "Basic and Clinical Pharmacology", "author": "Bertram G. Katzung", "department": "Pharmacy", "isbn": "978-1259641152", "edition": "14th", "copies": 5, "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
    { "customId": "PHARM-10", "title": "Review of Medical Microbiology and Immunology", "author": "Warren Levinson", "department": "Pharmacy", "isbn": "978-1259920011", "edition": "15th", "copies": 6, "image": "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?w=400" },
    { "customId": "PHARM-11", "title": "Textbook of Therapeutics: Drug and Disease Management", "author": "Richard A. Helms", "department": "Pharmacy", "isbn": "978-0781757348", "edition": "8th", "copies": 3, "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400" },
    { "customId": "PHARM-12", "title": "Pharmaceutical Jurisprudence", "author": "Dr. B.S. Kuchekar", "department": "Pharmacy", "isbn": "978-8196342111", "edition": "1st", "copies": 5, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "PHARM-13", "title": "Biopharmaceutics and Pharmacokinetics", "author": "D.M. Brahmankar", "department": "Pharmacy", "isbn": "978-8182470194", "edition": "2nd", "copies": 6, "image": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400" },
    { "customId": "PHARM-14", "title": "Lehninger Principles of Biochemistry", "author": "David L. Nelson", "department": "Pharmacy", "isbn": "978-1464126116", "edition": "7th", "copies": 5, "image": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400" },
    { "customId": "PHARM-15", "title": "Pharmaceutical Analysis", "author": "David G. Watson", "department": "Pharmacy", "isbn": "978-0702046216", "edition": "4th", "copies": 4, "image": "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?w=400" },
    { "customId": "PHARM-16", "title": "Clinical Pharmacy and Therapeutics", "author": "Cate Whittlesea", "department": "Pharmacy", "isbn": "978-0702070129", "edition": "6th", "copies": 4, "image": "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400" },
    { "customId": "PHARM-17", "title": "Microbiology: An Introduction", "author": "Gerard J. Tortora", "department": "Pharmacy", "isbn": "978-0321929150", "edition": "12th", "copies": 5, "image": "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?w=400" },
    { "customId": "PHARM-18", "title": "Wilson and Gisvold's Textbook of Organic Medicinal Chemistry", "author": "John M. Beale", "department": "Pharmacy", "isbn": "978-0781779296", "edition": "12th", "copies": 3, "image": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400" },
    { "customId": "PHARM-19", "title": "A Textbook of Pharmaceutical Organic Chemistry", "author": "Arun Bahl", "department": "Pharmacy", "isbn": "978-8121926140", "edition": "1st", "copies": 6, "image": "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?w=400" },
    { "customId": "PHARM-20", "title": "Instrumental Methods of Chemical Analysis", "author": "G.R. Chatwal", "department": "Pharmacy", "isbn": "978-9350248362", "edition": "5th", "copies": 4, "image": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400" },

    { "customId": "BBA-01", "title": "Principles of Management", "author": "Stephen P. Robbins", "department": "BBA", "isbn": "978-0133910292", "edition": "13th", "copies": 7, "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400" },
    { "customId": "BBA-02", "title": "Marketing Management", "author": "Philip Kotler", "department": "BBA", "isbn": "978-0133856460", "edition": "15th", "copies": 8, "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
    { "customId": "BBA-03", "title": "Principles of Corporate Finance", "author": "Richard A. Brealey", "department": "BBA", "isbn": "978-1259144387", "edition": "12th", "copies": 5, "image": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400" },
    { "customId": "BBA-04", "title": "Financial Accounting", "author": "Robert Libby", "department": "BBA", "isbn": "978-1259222139", "edition": "9th", "copies": 6, "image": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400" },
    { "customId": "BBA-05", "title": "Organizational Behavior", "author": "Stephen P. Robbins", "department": "BBA", "isbn": "978-0134103983", "edition": "17th", "copies": 5, "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400" },
    { "customId": "BBA-06", "title": "Human Resource Management", "author": "Gary Dessler", "department": "BBA", "isbn": "978-0134235455", "edition": "15th", "copies": 6, "image": "https://images.unsplash.com/photo-1521791136368-1a46827d0a15?w=400" },
    { "customId": "BBA-07", "title": "Macroeconomics", "author": "N. Gregory Mankiw", "department": "BBA", "isbn": "978-1464182891", "edition": "9th", "copies": 4, "image": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400" },
    { "customId": "BBA-08", "title": "Microeconomics", "author": "Robert Pindyck", "department": "BBA", "isbn": "978-0134184241", "edition": "9th", "copies": 4, "image": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400" },
    { "customId": "BBA-09", "title": "Business Statistics: A Decision-Making Approach", "author": "David F. Groebner", "department": "BBA", "isbn": "978-0133096057", "edition": "9th", "copies": 5, "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
    { "customId": "BBA-10", "title": "Strategic Management: Concepts and Cases", "author": "Fred R. David", "department": "BBA", "isbn": "978-0134167848", "edition": "16th", "copies": 3, "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400" },
    { "customId": "BBA-11", "title": "Business Research Methods", "author": "Donald R. Cooper", "department": "BBA", "isbn": "978-0073521503", "edition": "12th", "copies": 4, "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400" },
    { "customId": "BBA-12", "title": "Operations Management", "author": "Jay Heizer", "department": "BBA", "isbn": "978-0134130422", "edition": "12th", "copies": 5, "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400" },
    { "customId": "BBA-13", "title": "International Business: Competing in the Global Marketplace", "author": "Charles W. L. Hill", "department": "BBA", "isbn": "978-1259570544", "edition": "11th", "copies": 3, "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400" },
    { "customId": "BBA-14", "title": "Management Information Systems", "author": "Kenneth C. Laudon", "department": "BBA", "isbn": "978-0133898163", "edition": "14th", "copies": 6, "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400" },
    { "customId": "BBA-15", "title": "Consumer Behavior", "author": "Leon G. Schiffman", "department": "BBA", "isbn": "978-0132544368", "edition": "10th", "copies": 4, "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
    { "customId": "BBA-16", "title": "Entrepreneurship: Successfully Launching New Ventures", "author": "Bruce R. Barringer", "department": "BBA", "isbn": "978-0133797183", "edition": "5th", "copies": 5, "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400" },
    { "customId": "BBA-17", "title": "Cost Accounting: A Managerial Emphasis", "author": "Charles T. Horngren", "department": "BBA", "isbn": "978-0133428704", "edition": "15th", "copies": 4, "image": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400" },
    { "customId": "BBA-18", "title": "Business Law", "author": "Nickolas James", "department": "BBA", "isbn": "978-0730369271", "edition": "5th", "copies": 5, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "BBA-19", "title": "Supply Chain Management: Strategy, Planning", "author": "Sunil Chopra", "department": "BBA", "isbn": "978-0133800203", "edition": "6th", "copies": 4, "image": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400" },
    { "customId": "BBA-20", "title": "Managerial Economics", "author": "Christopher Thomas", "department": "BBA", "isbn": "978-0078021909", "edition": "11th", "copies": 3, "image": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400" },

    { "customId": "ELL-01", "title": "The Study of Language", "author": "George Yule", "department": "ELL", "isbn": "978-1107615250", "edition": "5th", "copies": 6, "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400" },
    { "customId": "ELL-02", "title": "A History of the English Language", "author": "Albert C. Baugh", "department": "ELL", "isbn": "978-0415655378", "edition": "6th", "copies": 4, "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400" },
    { "customId": "ELL-03", "title": "An Introduction to Language", "author": "Victoria Fromkin", "department": "ELL", "isbn": "978-1133310686", "edition": "10th", "copies": 5, "image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { "customId": "ELL-04", "title": "The Norton Anthology of English Literature", "author": "Stephen Greenblatt", "department": "ELL", "isbn": "978-0393912470", "edition": "9th", "copies": 3, "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400" },
    { "customId": "ELL-05", "title": "Literary Theory: An Introduction", "author": "Terry Eagleton", "department": "ELL", "isbn": "978-0816654475", "edition": "3rd", "copies": 5, "image": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400" },
    { "customId": "ELL-06", "title": "Practical English Usage", "author": "Michael Swan", "department": "ELL", "isbn": "978-0194202466", "edition": "4th", "copies": 12, "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400" },
    { "customId": "ELL-07", "title": "A Glossary of Literary Terms", "author": "M.H. Abrams", "department": "ELL", "isbn": "978-1285465067", "edition": "11th", "copies": 8, "image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { "customId": "ELL-08", "title": "Principles of Language Learning and Teaching", "author": "H. Douglas Brown", "department": "ELL", "isbn": "978-0133041941", "edition": "6th", "copies": 6, "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400" },
    { "customId": "ELL-09", "title": "How Languages are Learned", "author": "Patsy M. Lightbown", "department": "ELL", "isbn": "978-0194541268", "edition": "4th", "copies": 5, "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400" },
    { "customId": "ELL-10", "title": "Course in General Linguistics", "author": "Ferdinand de Saussure", "department": "ELL", "isbn": "978-0231157278", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400" },
    { "customId": "ELL-11", "title": "Sociolinguistics: An Introduction to Language and Society", "author": "Peter Trudgill", "department": "ELL", "isbn": "978-0140289213", "edition": "4th", "copies": 4, "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400" },
    { "customId": "ELL-12", "title": "Second Language Acquisition", "author": "Susan M. Gass", "department": "ELL", "isbn": "978-0415891745", "edition": "4th", "copies": 5, "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400" },
    { "customId": "ELL-13", "title": "A History of Literary Criticism", "author": "M.A.R. Habib", "department": "ELL", "isbn": "978-0631232001", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400" },
    { "customId": "ELL-14", "title": "Discourse Analysis", "author": "Gillian Brown", "department": "ELL", "isbn": "978-0521271448", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400" },
    { "customId": "ELL-15", "title": "English Phonetics and Phonology", "author": "Peter Roach", "department": "ELL", "isbn": "978-0521717403", "edition": "4th", "copies": 7, "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400" },
    { "customId": "ELL-16", "title": "Semantics", "author": "John I. Saeed", "department": "ELL", "isbn": "978-1118430163", "edition": "4th", "copies": 3, "image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { "customId": "ELL-17", "title": "Syntax: A Generative Introduction", "author": "Andrew Carnie", "department": "ELL", "isbn": "978-1118353721", "edition": "3rd", "copies": 4, "image": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400" },
    { "customId": "ELL-18", "title": "Contemporary Stylistics", "author": "Marina Lambrou", "department": "ELL", "isbn": "978-0826493958", "edition": "1st", "copies": 3, "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400" },
    { "customId": "ELL-19", "title": "Cambridge Encyclopedia of the English Language", "author": "David Crystal", "department": "ELL", "isbn": "978-0521530330", "edition": "2nd", "copies": 2, "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400" },
    { "customId": "ELL-20", "title": "Teaching English as a Second or Foreign Language", "author": "Marianne Celce-Murcia", "department": "ELL", "isbn": "978-1111351694", "edition": "4th", "copies": 6, "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400" },

    { "customId": "LAW-01", "title": "Learning the Law", "author": "Glanville Williams", "department": "Law", "isbn": "978-0414051294", "edition": "16th", "copies": 8, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-02", "title": "The Concept of Law", "author": "H.L.A. Hart", "department": "Law", "isbn": "978-0199644704", "edition": "3rd", "copies": 5, "image": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400" },
    { "customId": "LAW-03", "title": "Constitutional Law of Bangladesh", "author": "Mahmudul Islam", "department": "Law", "isbn": "978-9843313980", "edition": "3rd", "copies": 6, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-04", "title": "Jurisprudence and Legal Theory", "author": "V.D. Mahajan", "department": "Law", "isbn": "978-8121901468", "edition": "5th", "copies": 7, "image": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400" },
    { "customId": "LAW-05", "title": "The Code of Criminal Procedure", "author": "Surendra Malik", "department": "Law", "isbn": "978-8170121142", "edition": "21st", "copies": 4, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-06", "title": "The Code of Civil Procedure", "author": "Dinshah Fardunji Mulla", "department": "Law", "isbn": "978-8131251034", "edition": "19th", "copies": 4, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-07", "title": "Principles of Mohammadat Law", "author": "Dinshah Fardunji Mulla", "department": "Law", "isbn": "978-8131252000", "edition": "22nd", "copies": 5, "image": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400" },
    { "customId": "LAW-08", "title": "The Law of Evidence", "author": "M. Monir", "department": "Law", "isbn": "978-8170121555", "edition": "15th", "copies": 5, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-09", "title": "International Law", "author": "Malcolm N. Shaw", "department": "LAW", "isbn": "978-1316638538", "edition": "8th", "copies": 4, "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400" },
    { "customId": "LAW-10", "title": "An Introduction to the Study of the Law of the Constitution", "author": "A.V. Dicey", "department": "Law", "isbn": "978-0511843945", "edition": "10th", "copies": 3, "image": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400" },
    { "customId": "LAW-11", "title": "The Penal Code", "author": "Ratanlal & Dhirajlal", "department": "Law", "isbn": "978-9351452331", "edition": "34th", "copies": 6, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-12", "title": "The Law of Torts", "author": "Ratanlal & Dhirajlal", "department": "Law", "isbn": "978-9351454111", "edition": "27th", "copies": 5, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-13", "title": "An Introduction to Alternative Dispute Resolution", "author": "MD. Mustafa Kamal", "department": "Law", "isbn": "978-9843340011", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400" },
    { "customId": "LAW-14", "title": "Company Law", "author": "Avtar Singh", "department": "Law", "isbn": "978-9351451990", "edition": "16th", "copies": 3, "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400" },
    { "customId": "LAW-15", "title": "Labour and Industrial Law of Bangladesh", "author": "Nirmalendu Dhar", "department": "Law", "isbn": "978-9848135000", "edition": "2nd", "copies": 5, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-16", "title": "Human Rights in International Law", "author": "Philip Alston", "department": "Law", "isbn": "978-0198260011", "edition": "1st", "copies": 4, "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400" },
    { "customId": "LAW-17", "title": "The Transfer of Property Act", "author": "D.F. Mulla", "department": "Law", "isbn": "978-8131251348", "edition": "13th", "copies": 4, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-18", "title": "Hindu Law", "author": "Dinshah Fardunji Mulla", "department": "Law", "isbn": "978-8131251782", "edition": "23rd", "copies": 3, "image": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400" },
    { "customId": "LAW-19", "title": "Equity, Mortgages, Trust and Specific Relief", "author": "B.M. Gandhi", "department": "Law", "isbn": "978-8170129001", "edition": "4th", "copies": 5, "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" },
    { "customId": "LAW-20", "title": "Legal Research and Writing", "author": "Ted Tzeng", "department": "Law", "isbn": "978-1111356221", "edition": "3rd", "copies": 3, "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400" }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Starting additional data seed...');
    
    try {
      // Insert new books WITHOUT clearing the existing ones
      const mappedBooks = moreBooksData.map(book => ({
        ...book,
        totalCopies: book.copies,
        availableCopies: book.copies
      }));
      await Book.insertMany(mappedBooks);
      console.log(`Successfully seeded ${mappedBooks.length} MORE books into the database!`);
      
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      mongoose.disconnect();
      console.log('MongoDB connection closed.');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
