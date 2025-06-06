"use client";

import { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Video,
  Search,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: "How do I add a new item to my inventory?",
    answer:
      "To add a new item, click the 'Add New Item' button on the Items page or use the quick action on the dashboard. Fill in the required details such as name, type, location, and status, then click 'Add Item' to save it to your inventory.",
    category: "Getting Started",
  },
  {
    question: "How do I report an issue with an item?",
    answer:
      "You can report an issue by clicking on the item in your inventory and selecting 'Report Issue'. Fill in the issue details including type, urgency, and description. The issue will be tracked in the Issues page.",
    category: "Issues",
  },
  {
    question: "What do the different item statuses mean?",
    answer:
      "Items can have the following statuses: Active (in use), Maintenance Needed (requires attention), Inactive (not in use), and Archived (no longer tracked). You can update an item's status at any time.",
    category: "Items",
  },
  {
    question: "How do I export my inventory data?",
    answer:
      "You can export your inventory data by going to the Reports page and clicking the 'Export Report' button. Choose your preferred format (CSV or PDF) and the data will be downloaded to your device.",
    category: "Reports",
  },
  {
    question: "Can I customize the notification settings?",
    answer:
      "Yes, you can customize your notification preferences in the Settings page. Choose which alerts you want to receive and how you want to be notified (email, in-app, or both).",
    category: "Settings",
  },
];

const categories = [
  "Getting Started",
  "Items",
  "Issues",
  "Reports",
  "Settings",
  "Account",
];

export default function HelpPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory
      ? faq.category === selectedCategory
      : true;
    const matchesSearch = searchQuery
      ? faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        expanded={sidebarExpanded}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      <div
        className={`transition-all duration-300 ${
          sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Help & Support
              </h1>
              <p className="text-gray-600">
                Find answers to common questions and get support
              </p>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <MessageCircle className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium">Live Chat</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Mail className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium">Email Us</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories
                </h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category ? null : category
                        )
                      }
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedFaq(expandedFaq === index ? null : index)
                        }
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {faq.question}
                        </span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Phone Support
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Available Monday to Friday, 9am - 5pm EST
              </p>
              <a
                href="tel:+1234567890"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                +1 (234) 567-890
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Live Chat
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Chat with our support team in real-time
              </p>
              <button className="text-sm font-medium text-green-600 hover:text-green-700">
                Start Chat
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Documentation
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Browse our detailed documentation and guides
              </p>
              <a
                href="#"
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                View Documentation
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
