import React from 'react';
import { Github, ExternalLink, Users, Code, Palette, Globe } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  github?: string;
  linktree?: string;
  skills: string[];
}

const TeamPage: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Kile',
      role: 'Main Developer',
      description: "Hi, I'm the main dev of Killua and aspiring developer, I have knowledge in js, ts, rust, python, and c#. If you have any questions about python, Killua or discord in general, feel free to contact me. I am also for hire for your projects.",
      image: '/team/kile.png',
      github: 'https://github.com/Kile',
      skills: ['JavaScript', 'TypeScript', 'Rust', 'Python', 'C#']
    },
    {
      name: 'ClashCrafter',
      role: 'Developer',
      description: 'I am a 15 year old boy from Germany. I love games and PCs. In my spare time I program with C#, TypeScript and Python and I would like to study computer science.',
      image: '/team/clashcrafter.png',
      github: 'https://github.com/FlorianStrobl',
      skills: ['C#', 'TypeScript', 'Python']
    },
    {
      name: 'DerUSBstick',
      role: 'Developer',
      description: "Hi, I am DerUSBstick and I am from Germany. In my free time I really enjoy playing games or coding. I code in Python and I am going to start my apprenticeship as software developer soon™️.",
      image: '/team/derusbstick.png',
      github: 'https://github.com/DerUSBstick',
      skills: ['Python', 'Software Development']
    },
    {
      name: 'danii',
      role: 'Backend Developer',
      description: "Someone trying to make something interesting for the world to enjoy. Back end developer and tinkerer. Looking for a job.",
      image: '/team/danii.jpeg',
      github: 'https://github.com/danii',
      skills: ['Backend Development', 'System Architecture']
    },
    {
      name: 'MNW',
      role: 'Artist & Illustrator',
      description: "こんにちは、MISOTO です、I love to Illustrate and am really into Manga and Illustrations. Right now I'm a bit busy. Let's keep thriving our dreams!",
      image: '/team/mnw.png',
      linktree: 'https://linktr.ee/Michaelnw_mnw',
      skills: ['Illustration', 'Manga Art', 'Digital Art']
    },
    {
      name: 'WhoAmI',
      role: 'Web Developer',
      description: 'Hello. I am a developer from the US who mainly specializes in websites. I also code in other languages, such as JS, Python, etc.',
      image: '/team/whoami.png',
      github: 'https://github.com/WhoAmI1000',
      skills: ['Web Development', 'JavaScript', 'Python']
    },
    {
      name: 'devmkay',
      role: 'Fullstack Developer',
      description: 'Fullstack Web Developer.',
      image: '/team/devmkay.png',
      github: 'https://github.com/miko0000',
      skills: ['Fullstack Development', 'Web Technologies']
    }
  ];

  const getRoleIcon = (role: string) => {
    if (role.includes('Developer')) return <Code className="h-5 w-5" />;
    if (role.includes('Artist') || role.includes('Illustrator')) return <Palette className="h-5 w-5" />;
    if (role.includes('Web')) return <Globe className="h-5 w-5" />;
    return <Users className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-discord-darker text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Meet the <span className="text-discord-blurple">Team</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The talented developers and creators behind Killua who make this amazing bot possible.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-discord-dark border border-gray-600 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group"
            >
              {/* Member Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Role Badge */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2 bg-discord-blurple/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {getRoleIcon(member.role)}
                    <span>{member.role}</span>
                  </div>
                </div>
              </div>

              {/* Member Info */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {member.description}
                </p>

                {/* Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="bg-discord-darker border border-gray-600 text-gray-300 px-2 py-1 rounded-md text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex gap-3">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                    >
                      <Github className="h-4 w-4" />
                      <span className="text-sm">GitHub</span>
                    </a>
                  )}
                  {member.linktree && (
                    <a
                      href={member.linktree}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">Links</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Join the Team CTA */}
        <div className="mt-20 text-center">
          <div className="bg-discord-dark border border-gray-600 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Want to join our team?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              We're always looking for talented developers, artists, and contributors to help make Killua even better.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://discord.gg/FdErZCd"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                <Users className="h-6 w-6" />
                Join Our Discord
              </a>
              <a
                href="https://github.com/Kile"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                <Github className="h-6 w-6" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
