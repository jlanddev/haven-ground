"use client";

import { useState } from 'react';

export default function TeamPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const teamMembers = [
    {
      name: "Jordan Harmon",
      title: "Founder & President",
      bio: "Jordan's happiest when he's outdoors with his two puppies (his \"bestest boys\"), spending time with family and friends, volunteering at the local fire department, or unwinding with a movie night alongside Natalie. His work with the Children's Hospital and the RiseLyFe Foundation stems from personal childhood experiences, giving him a genuine passion that runs as deep as his love for land and building.\n\nJordan believes in his heart that making others feel safe, important, and loved defines a life well lived. These values bring the most meaning to his journey.\n\nStarting as construction labor, Jordan worked his way up through the ranks, gaining hands-on experience across diverse communities—from sprawling ranch properties to higher-density neighborhoods for national homebuilders. This ground-level perspective gave him real insights into what makes communities thrive, wisdom he now pours into Haven Ground as its founder."
    },
    {
      name: "Natalie Caruso",
      title: "Finance Director",
      bio: "Natalie is a Binghamton University School of Management grad who keeps our numbers straight and makes sure we don't do anything financially stupid. She's the reason we can actually deliver on our promises.\n\nWhen she's not crunching numbers, she's probably telling Jordan which movie they're watching tonight or pouring her heart into community work. Natalie leads several of our children's foundation initiatives with genuine passion and dedication. Her spreadsheet organization system would make Marie Kondo proud, but it's her warmth and generosity that truly stand out."
    },
    {
      name: "Mike Harri",
      title: "Marketing Partner",
      bio: "Mike Harri brings a refreshing blend of marketing expertise and laid-back charm to our team. When not running his own companies and helping Haven develop subdivisions, you'll likely find him with toes in the sand at the nearest beach, his faithful pup Milo by his side, cruising top-down in his Jeep.\n\nMike and Jordan's paths crossed in land acquisition, where their shared light-heartedness and business passion made them two peas in a pod almost immediately. A humble success story in his own right, Mike has founded multiple marketing businesses over the past decade, including Lead-Bid.com, though he's more likely to ask about your day than talk about his achievements.\n\nWhile their partnership is still blossoming, Mike and Jordan have already accomplished impressive feats in land development, approaching each project with equal parts expertise and genuine enthusiasm."
    },
    {
      name: "Jon Hodde, RPLS No. 5197",
      title: "Land Surveying Partner",
      bio: "Jon has a pilot's license, which is pretty cool. He's been surveying land all over Texas and beyond for more than 25 years and knows his stuff inside and out.\n\nAs co-owner of Hodde & Hodde Land Surveying (since 1995), Jon has handled everything from Gulf Coast properties to New Mexico mountains. He got his Texas Registered Professional Land Surveyor License in 1996 and has served on the Texas Board of Professional Land Surveying for over 12 years.\n\nWhen boundary disputes get messy, Jon's the guy lawyers call as their expert witness. He makes sure our developments start with accurate surveys so we don't build your house in the wrong spot."
    },
    {
      name: "Ray Clarke",
      title: "Marketing Director",
      bio: "Ray just had a baby and is figuring out this whole parenting thing. When he's not changing diapers, he loves building relationships with our prospective landowners and being part of the community.\n\nHe ran his own marketing firm for 7 years before joining us. Ray believes in treating everyone like neighbors, not transactions, and genuinely enjoys getting to know the families and stories behind each property we work with."
    },
    {
      name: "Rudy Rodriguez",
      title: "Project Manager",
      bio: "With 7 years of excavation expertise, Rudy Rodriguez brings both skill and heart to every project he manages. After impressing everyone with his exceptional equipment handling, he was promoted to supervisor faster than his abuela's chancla when someone leaves the front door open.\n\nRudy's comprehensive mastery includes operating articulated trucks, dozers, and excavators, complemented by his precise surveying capabilities.\n\nWhen not transforming Texas landscapes, you'll find him grilling the best carne asada at company gatherings and telling stories about how his grandfather taught him that a man's word and handshake mean more than any written contract. His combination of technical knowledge, leadership, and family values makes Rudy the backbone of our development team."
    },
    {
      name: "Mateo Rodriguez",
      title: "Field Supervisor",
      bio: "Mateo Rodriguez, a proud Texas A&M graduate, brings a commanding presence and sharp attention to detail to his role as Field Supervisor. With a decade of experience molding Texas terrain, Mateo runs his crews with the perfect balance of discipline and heart—just like his grandmother ran her kitchen.\n\nKnown for completing projects not just on time but often ahead of schedule, he still finds moments to share his legendary homemade tamales during lunch breaks, claiming the secret recipe came to him in a dream after falling asleep watching \"Heavy Equipment Monthly.\"\n\nMateo's uncanny ability to anticipate challenges before they arise has saved countless hours and resources, leading the team to affectionately nickname him \"El Adivino\" (The Fortune Teller). His leadership philosophy is simple: treat the land with respect, your team like family, and every client like they're the only one that matters.\n\nWhen not on site, he can occasionally be spotted at Kyle Field, proudly sporting his Aggie maroon."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen font-serif bg-[#F5EFD9]">
      {/* Navigation */}
      <nav className="bg-[#F5EFD9] py-4 border-b border-[#D2C6B2] sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center relative z-20">
              <a href="/" className="relative">
                <img 
                  src="/images/Haven LOGO Use.png" 
                  alt="Haven Ground Logo" 
                  className="h-16 sm:h-20 md:h-24 w-auto hover:opacity-90 transition-opacity duration-300"
                />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a href="/properties" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Properties</a>
              <a href="/development" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Development</a>
              <a href="/sell-your-land" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Sell Us Land</a>
              <a href="/community" className="text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium transition-colors duration-200">Community</a>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative z-20 p-2 rounded-md text-[#2F4F33] hover:text-[#7D6B58] hover:bg-[#D2C6B2] focus:outline-none focus:ring-2 focus:ring-[#7D6B58] transition-colors duration-200"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden absolute top-full left-0 right-0 bg-[#F5EFD9] border-b border-[#D2C6B2] shadow-lg transform transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'translate-y-0 opacity-100 scale-y-100' : '-translate-y-2 opacity-0 scale-y-95 pointer-events-none'}`}>
            <div className="px-4 py-4 space-y-2">
              <a href="/properties" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Properties</a>
              <a href="/development" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Development</a>
              <a href="/sell-your-land" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Sell Us Land</a>
              <a href="/community" className="block text-[#2F4F33] hover:text-[#7D6B58] text-lg font-medium py-3 hover:bg-[#D2C6B2] rounded-lg px-4 transition-all duration-200 border-l-4 border-transparent hover:border-[#2F4F33]">Community</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-[#2F4F33] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2F4F33] to-[#1a2e1c] opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl text-[#F5EFD9] font-serif font-light mb-6 leading-tight">
              Meet the Team
            </h1>
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D2C6B2] to-transparent max-w-xs"></div>
              <span className="px-6 text-[#D2C6B2] font-serif text-xl italic">behind Haven Ground</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D2C6B2] to-transparent max-w-xs"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="py-20 bg-[#F5EFD9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {teamMembers.map((member, index) => (
              <div key={index} className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#2F4F33] font-serif font-light mb-4 px-2 break-words">{member.name}</h2>
                  <div className="flex items-center justify-center mb-6 px-4">
                    <div className="h-px bg-[#7D6B58] flex-1 max-w-16 sm:max-w-32"></div>
                    <span className="px-3 sm:px-6 text-[#7D6B58] font-medium text-base sm:text-lg text-center">{member.title}</span>
                    <div className="h-px bg-[#7D6B58] flex-1 max-w-16 sm:max-w-32"></div>
                  </div>
                </div>
                <div className="prose prose-lg max-w-none text-center px-4 sm:px-8">
                  {member.bio.split('\n\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-[#2F4F33] leading-relaxed mb-6 text-base sm:text-lg font-light max-w-4xl mx-auto break-words">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[#2F4F33] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl text-[#F5EFD9] font-serif font-light mb-6 break-words">Ready to Work With Us?</h2>
          <p className="text-lg sm:text-xl text-[#D2C6B2] mb-8 leading-relaxed break-words max-w-3xl mx-auto">
            Our team brings passion and experience to the land development industry. 
            Ready to serve your needs.
          </p>
          <a 
            href="/contact" 
            className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-8 py-4 text-lg font-medium hover:bg-[#D2C6B2] transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2F4F33] text-[#F5EFD9] py-16 border-t border-[#7D6B58]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-[#F5EFD9] italic font-serif">Haven Ground</h3>
              </div>
              <p className="text-[#D2C6B2] text-lg mb-4 leading-relaxed">
                Land and community, one meaningful handshake at a time.
              </p>
              <img src="/images/isaiah-58-10-banner.png" alt="Isaiah 58:10 - If you pour yourself out for the hungry" className="h-20 md:h-24 lg:h-28 w-auto" />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Home</a></li>
                <li><a href="/properties" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Properties</a></li>
                <li><a href="/development" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Development</a></li>
                <li><a href="/sell-your-land" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Sell Us Land</a></li>
                <li><a href="/community" className="text-[#D2C6B2] hover:text-[#F5EFD9] transition-colors duration-200">Community</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold text-[#F5EFD9] mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <p className="text-[#D2C6B2] text-sm">Find your homesite that feels the most like home</p>
                <a 
                  href="/contact" 
                  className="inline-block bg-[#F5EFD9] text-[#2F4F33] px-4 py-2 rounded-md hover:bg-[#D2C6B2] active:bg-[#D2C6B2] transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-[#7D6B58] text-center">
            <p className="text-[#D2C6B2] text-sm">
              &copy; {new Date().getFullYear()} Haven Ground. All rights reserved. 
              <span className="mx-2">|</span>
              Serving land owners from our heart.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}