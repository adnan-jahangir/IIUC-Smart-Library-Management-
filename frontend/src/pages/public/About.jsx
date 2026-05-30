import React from 'react';
import { BookOpen, Target, Users, ShieldCheck, Globe } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Revitalizing the Library Experience</h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        The IIUC Smart Library Management System is a state-of-the-art platform designed to bridge the gap between traditional academic resources and modern digital accessibility.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-24 container mx-auto px-6 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex p-3 bg-emerald-100 rounded-2xl text-emerald-600 mb-6">
                            <Target className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Our mission is to foster a culture of research and lifelong learning by providing students and faculty members with seamless, intelligent, and real-time access to the university's literary and academic wealth. We leverage AI to guide your academic journey.
                        </p>
                    </div>
                    <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100">
                        <div className="inline-flex p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-6">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Vision</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            To become the benchmark for digital academic libraries in Bangladesh, transforming the way international Islamic universities manage and disseminate knowledge through cutting-edge automation and student-centric design.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-emerald-600 text-white">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">25,000+</div>
                            <div className="text-emerald-100 font-medium">Physical Volumes</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">12,000+</div>
                            <div className="text-emerald-100 font-medium">Active Members</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">150k+</div>
                            <div className="text-emerald-100 font-medium">Annual Borrows</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">24/7</div>
                            <div className="text-emerald-100 font-medium">Digital Access</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 container mx-auto px-6 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Why IIUC Smart Library?</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">Built from the ground up for a premium academic experience.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center group">
                        <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:bg-emerald-600 group-hover:text-white group-hover:-translate-y-2 transition-all">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Community First</h3>
                        <p className="text-slate-500">Dedicated portals for students, teachers, and staff designed for collaboration.</p>
                    </div>
                    <div className="text-center group">
                        <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:bg-indigo-600 group-hover:text-white group-hover:-translate-y-2 transition-all">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Vast Collection</h3>
                        <p className="text-slate-500">From CSE to Islamic Law, we host materials from every academic department.</p>
                    </div>
                    <div className="text-center group">
                        <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:-translate-y-2 transition-all">
                            <Globe className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">AI Powered</h3>
                        <p className="text-slate-500">Powered by our library assistant for advanced recommendations and academic summarizations.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
