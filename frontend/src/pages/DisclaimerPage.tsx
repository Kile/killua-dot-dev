import React from 'react';
import { Shield, Mail, FileText, Eye, Lock, Users } from 'lucide-react';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-discord-darker text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-discord-blurple/20 rounded-full flex items-center justify-center">
              <Shield className="h-10 w-10 text-discord-blurple" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Privacy & <span className="text-discord-blurple">Disclaimer</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your privacy and data security are important to us. Learn how we handle your information.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Data Collection */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-discord-blurple/20 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-discord-blurple" />
              </div>
              <h2 className="text-2xl font-bold">Data Collection</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Killua only collects and stores the minimum amount of data necessary to provide our services. 
              This includes basic Discord user information (username, user ID, avatar) and server-specific 
              settings that you configure. We do not collect, store, or process any personal messages, 
              private conversations, or sensitive information.
            </p>
          </div>

          {/* Data Usage */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-discord-green/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-discord-green" />
              </div>
              <h2 className="text-2xl font-bold">How We Use Your Data</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              The data we collect is used exclusively for:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Providing bot functionality and commands</li>
              <li>Storing your preferences and settings</li>
              <li>Managing premium features and subscriptions</li>
              <li>Improving bot performance and user experience</li>
              <li>Providing customer support when needed</li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-discord-yellow/20 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-discord-yellow" />
              </div>
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              We implement industry-standard security measures to protect your data. We regularly review 
              and update our security practices to ensure the highest level of protection for your information.
            </p>
          </div>

          {/* Data Retention */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-discord-fuchsia/20 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-discord-fuchsia" />
              </div>
              <h2 className="text-2xl font-bold">Data Retention</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              We retain your data only as long as necessary to provide our services. If you remove Killua 
              from your server or delete your account, we will delete all associated data within 30 days. 
              You can also request immediate data deletion at any time.
            </p>
          </div>

          {/* Data Removal */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-discord-red/20 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-discord-red" />
              </div>
              <h2 className="text-2xl font-bold">Requesting Data Removal</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              You have the right to request the deletion of all data associated with your Discord account 
              or server. To request data removal, please contact us at:
            </p>
            <div className="bg-discord-darker border border-gray-600 rounded-lg p-4 text-center">
              <a 
                href="mailto:kile@killua.dev" 
                className="text-discord-blurple hover:text-discord-blurple/80 font-semibold text-lg"
              >
                kile@killua.dev
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-3 text-center">
              Please include your Discord username and server name in your request for faster processing.
            </p>
          </div>

          {/* Third-Party Services */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Killua integrates with the following third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong><a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="text-discord-blurple hover:text-discord-blurple/80">Discord</a>:</strong> For bot functionality and user authentication</li>
              <li><strong><a href="https://www.patreon.com/" target="_blank" rel="noopener noreferrer" className="text-discord-blurple hover:text-discord-blurple/80">Patreon</a>:</strong> For premium subscription management</li>
              <li><strong><a href="https://www.hetzner.com/" target="_blank" rel="noopener noreferrer" className="text-discord-blurple hover:text-discord-blurple/80">Hetzner</a>:</strong> For bot operation and hosting</li>
              <li><strong><a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer" className="text-discord-blurple hover:text-discord-blurple/80">MongoDB Atlas</a>:</strong> For data storage</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Each of these services has their own privacy policies and data handling practices. 
              We recommend reviewing their policies to understand how they process your information.
            </p>
          </div>

          {/* Updates */}
          <div className="bg-discord-dark border border-gray-600 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Policy Updates</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this privacy policy from time to time to reflect changes in our practices 
              or applicable laws. We will notify users of any material changes through our Discord server 
              or website. Continued use of Killua after such changes constitutes acceptance of the updated policy.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-discord-blurple to-discord-fuchsia rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Questions or Concerns?</h2>
            <p className="text-white/90 mb-6">
              If you have any questions about this privacy policy or our data practices, 
              please don't hesitate to reach out to us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:kile@killua.dev"
                className="bg-white text-discord-blurple font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Mail className="h-5 w-5" />
                Email Us
              </a>
              <a
                href="https://discord.gg/FdErZCd"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent border-2 border-white text-white font-bold px-6 py-3 rounded-lg hover:bg-white hover:text-discord-blurple transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Users className="h-5 w-5" />
                Join Discord
              </a>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;
