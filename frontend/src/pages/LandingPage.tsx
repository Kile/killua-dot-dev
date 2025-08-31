import React, { useState, useEffect } from 'react';
import { Bot, Users, Server, Heart, Star } from 'lucide-react';
import LinkButton from '../components/LinkButton';
import Loading from '../components/Loading';

interface Stats {
  guilds: number;
  shards: number;
  registered_users: number;
  last_restart: number;
  user_installs?: number; // optional: display instead of shards when present
}

const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Actions',
      description: 'The most advanced action commands on discord',
      image: '/features/1.png',
      highlight: 'most'
    },
    {
      title: 'Cards',
      description: 'Battle & collect with Killua\'s own "Greed Island" themed card game',
      image: '/features/2.png',
      highlight: 'Greed Island'
    },
    {
      title: 'Todo lists',
      description: 'Powerful todo lists equipped for anything (even rickrolls)',
      image: '/features/3.png',
      highlight: 'anything'
    },
    {
      title: 'Games',
      description: 'Challenge your friends to various games or play singleplayer',
      image: '/features/4.png',
      highlight: 'games'
    },
    {
      title: 'Image manipulation',
      description: 'Let images descend into madness with image manipulation',
      image: '/features/5.png',
      highlight: 'madness'
    },
    {
      title: 'Tags',
      description: 'Tags built to save time and Rick Astley GIFs',
      image: '/features/6.png',
      highlight: 'built'
    },
    {
      title: 'And much more',
      description: 'Make use of Killua\'s over 100 commands',
      image: '/features/7.png',
      highlight: 'much'
    }
  ];

  return (
    <div className="min-h-screen bg-discord-darker text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Left: Title, subheading, stats, buttons */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                Killua: The bot that does it{' '}
                <span className="text-discord-blurple">better</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto md:mx-0">
                A fun, unique multipurpose bot that's influenced by your ideas and wishes.
              </p>

              {/* Stats Section */}
              {loading ? (
                <div className="flex justify-center md:justify-start mb-12">
                  <Loading size="sm" />
                </div>
              ) : stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 max-w-4xl md:max-w-none mx-auto md:mx-0">
                  <div className="text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-2">
                      <Server className="h-8 w-8 text-discord-blurple" />
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.guilds.toLocaleString()}</div>
                    <div className="text-gray-400">Servers</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-2">
                      <Users className="h-8 w-8 text-discord-green" />
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.registered_users.toLocaleString()}</div>
                    <div className="text-gray-400">Users</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-2">
                      <Star className="h-8 w-8 text-discord-yellow" />
                    </div>
                    <div className="text-3xl font-bold text-white">{(stats.user_installs ?? 0).toLocaleString()}</div>
                    <div className="text-gray-400">User Installs</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center md:items-start">
                <LinkButton
                  href="https://discord.com/oauth2/authorize?client_id=756206646396452975&scope=bot&permissions=1342531648"
                  className="btn-primary flex items-center gap-2 px-8 py-4 text-lg whitespace-nowrap"
                >
                  <Bot className="h-6 w-6" />
                  Invite
                </LinkButton>
                <LinkButton
                  href="https://discord.gg/FdErZCd"
                  className="btn-secondary flex items-center gap-2 px-8 py-4 text-lg whitespace-nowrap"
                >
                  <Users className="h-6 w-6" />
                  Support
                </LinkButton>
                <LinkButton
                  href="https://www.patreon.com/KileAlkuri"
                  className="bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 px-8 py-4 text-lg whitespace-nowrap rounded-lg"
                >
                  <Heart className="h-6 w-6" />
                  Patreon
                </LinkButton>
              </div>
            </div>

            {/* Right: Transparent illustration (no border) */}
            <div className="flex-1 hidden md:flex justify-end">
              <img
                src="/illustrations/main-stats.png"
                alt="Killua illustration"
                className="max-h-[640px] w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-discord-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover what makes Killua the ultimate Discord bot experience
            </p>
          </div>

          <div className="space-y-12">
            {features.map((feature, index) => (
              <div key={feature.title} className="bg-discord-darker border border-gray-700 rounded-2xl p-6">
                <div
                  className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
                >
                  {/* Image Section */}
                  <div className="flex-1 w-full lg:w-1/2">
                    <div className="relative group">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-auto rounded-2xl shadow-2xl transform transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 w-full lg:w-1/2 text-center lg:text-left">
                    <h3 className="text-3xl md:text-4xl font-bold mb-6">
                      {feature.title.split(' ').map((word, wordIndex) => {
                        if (word.toLowerCase() === feature.highlight.toLowerCase()) {
                          return (
                            <span key={wordIndex} className="text-discord-blurple">
                              {word}{' '}
                            </span>
                          );
                        }
                        return word + ' ';
                      })}
                    </h3>
                    <p className="text-xl text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-discord-blurple to-discord-fuchsia">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to experience the difference?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of servers already using Killua and discover what makes us special.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton
              href="https://discord.com/oauth2/authorize?client_id=756206646396452975&scope=bot&permissions=1342531648"
              className="bg-white text-discord-blurple font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Bot className="h-6 w-6" />
              Get Started Now
            </LinkButton>
            <LinkButton
              href="https://discord.gg/FdErZCd"
              className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-discord-blurple transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Users className="h-6 w-6" />
              Join Community
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
