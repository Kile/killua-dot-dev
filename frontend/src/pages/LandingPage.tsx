import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Users, Server, Heart, Star, X, ChevronRight } from 'lucide-react';
import LinkButton from '../components/LinkButton';
import Loading from '../components/Loading';
import { botCategories } from '../utils/exploreCategories';

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
  const [wizardOpen, setWizardOpen] = useState(false);

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

  const reviews = [
    {
      name: 'Geographs',
      content: 'Very good bot. One of my favorites :D'
    },
    {
      name: 'BzoidMaluko126',
      content: 'Awesome bot, love the idea'
    },
    {
      name: 'untildoomsday',
      content: 'just an outstanding bot, i recommend highly.'
    },
    {
      name: '\'kaitokid',
      content: 'Interesting bot concept and excellent result. A variety of commands and a great way to have fun in a server, would recommend for smaller servers starting out. 5/5'
    },
    {
      name: 'Coob The User',
      content: 'Amazing bot! i\'m glad kile#0606 created it! it sparks new conversation, allows people to hug others, and more! i really enjoy using it, even if it has a bit of bugs owo 10/10 would recommend yes im being extra lmao, i really do love this bot though uwu'
    },
    {
      name: 'Roselle',
      content: 'amazing'
    },
    {
      name: 'WhoAmI',
      content: 'Great bot, transparent and many commands. A unique economy and many fun commands, including image manipulation.'
    },
    {
      name: 'Nate Satorou',
      content: 'Outstanding bot, has many commands including fun, hugs, economy, todo lists, image manipulation and much more, I can\'t want for more amazing updates'
    },
    {
      name: 'bitomic',
      content: 'Cool bot, huele a limón. Excelente servicio 11/10 would recommend.'
    },
    {
      name: 'ClashCrafter',
      content: 'Really nice Bot!!'
    },
    {
      name: 'rollingswordfish',
      content: 'Great bot'
    },
    {
      name: 'N789EX',
      content: 'Great bot idea! Can\'t wait for more updates!'
    },
    {
      name: 'mAtERIaLgWoRL',
      content: 'your mom is pog'
    },
    {
      name: 'rotten_fetus_( ͡°з ͡°)',
      content: 'The bot is nice i like collecting cards'
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

              {/* Wizard Prompt */}
              <button
                onClick={() => setWizardOpen(true)}
                className="mt-8 text-gray-400 hover:text-white transition-colors duration-200 flex flex-col sm:flex-row items-center gap-2 mx-auto md:mx-0 group"
              >
                <span className="text-sm">Not sure where to start?</span>
                <span className="text-discord-blurple group-hover:underline text-sm font-medium text-center">Find out what Killua can do for you</span>
                <ChevronRight className="w-4 h-4 text-discord-blurple" />
              </button>
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

      {/* Reviews Section */}
      <div className="py-16 bg-discord-darker overflow-hidden">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Users</h2>
          <p className="text-gray-400">
            Real reviews from our{' '}
            <a 
              href="https://top.gg/bot/756206646396452975" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-discord-blurple hover:underline"
            >
              top.gg
            </a>
            {' '}page
          </p>
        </div>
        
        <div className="marquee-container">
          <div className="marquee-track">
            {/* First set of reviews */}
            {reviews.map((review, index) => {
              const avatarColors = ['bg-discord-blurple', 'bg-discord-green', 'bg-discord-yellow', 'bg-discord-fuchsia', 'bg-red-500'];
              const colorClass = avatarColors[index % avatarColors.length];
              return (
                <div
                  key={`review-1-${index}`}
                  className="flex-shrink-0 w-80 mx-3 bg-discord-dark border border-gray-700 rounded-xl p-5"
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center p-2`}>
                      <img src="/brand/discord-logo.png" alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-white">{review.name}</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{review.content}</p>
                </div>
              );
            })}
            {/* Duplicate set for seamless loop */}
            {reviews.map((review, index) => {
              const avatarColors = ['bg-discord-blurple', 'bg-discord-green', 'bg-discord-yellow', 'bg-discord-fuchsia', 'bg-red-500'];
              const colorClass = avatarColors[index % avatarColors.length];
              return (
                <div
                  key={`review-2-${index}`}
                  className="flex-shrink-0 w-80 mx-3 bg-discord-dark border border-gray-700 rounded-xl p-5"
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center p-2`}>
                      <img src="/brand/discord-logo.png" alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-white">{review.name}</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{review.content}</p>
                </div>
              );
            })}
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

      {/* Wizard Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setWizardOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-discord-dark border border-gray-600 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h3 className="text-xl font-bold text-white">What can Killua help you with?</h3>
              <button
                onClick={() => setWizardOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <p className="text-gray-400 mb-6 text-center">I'm looking for a bot that...</p>
              <div className="space-y-3">
                {botCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/explore/${category.id}`}
                    onClick={() => setWizardOpen(false)}
                    className="w-full flex items-center gap-4 p-4 bg-discord-darker hover:bg-discord-darker/80 border border-gray-700 hover:border-discord-blurple/50 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-discord-blurple/20 flex items-center justify-center text-discord-blurple group-hover:bg-discord-blurple group-hover:text-white transition-colors">
                      {category.icon}
                    </div>
                    <span className="text-left text-gray-200 group-hover:text-white transition-colors flex-1">
                      {category.title}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-discord-blurple transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
