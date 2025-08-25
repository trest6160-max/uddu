import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">📄</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">UDIN</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Professional document verification and UDIN services by qualified chartered accountants.
            </p>
            <div className="text-sm text-gray-600">
              <p className="font-semibold">DashMyCA Private Limited</p>
              <p>Email: info@dashca.in</p>
              <p>Phone: +91-9836777722</p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              SERVICES
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Statutory Audit</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Tax Audit</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Balance Sheet</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">ROC Services</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">UDIN Generation</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              QUICK LINKS
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Login</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Sign Up</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Upload Documents</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              LEGAL
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms & Conditions</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Pricing Policy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Delivery Policy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Cancellation & Refund</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2025 DashMyCA Private Limited. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 mt-2 md:mt-0">
              Jurisdiction: Kolkata, West Bengal • Governed by Laws of India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
