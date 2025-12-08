import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Award, 
  Globe, 
  Users, 
  BookOpen, 
  Sparkles, 
  Star, 
  Gem, 
  UserCircle, 
  Rocket, 
  Palette, 
  Lightbulb,
  Calculator,
  FlaskConical,
  Languages,
  Laptop,
  PersonStanding,
  Dumbbell
} from "lucide-react";

export default function Home() {
  return (
    <div className="pt-20 sm:pt-24 bg-white transition-colors duration-300">
      {/* Hero Section - Ultra Luxury */}
      <section className="min-h-screen relative overflow-hidden">
        {/* Luxury Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-50/30 via-transparent to-purple-50/20"></div>
        
        {/* Premium Floating Elements - Hidden on mobile for performance */}
        <div className="hidden sm:block absolute top-20 left-20 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/30 rounded-full animate-float blur-sm"></div>
        <div className="hidden sm:block absolute top-40 right-32 w-16 h-16 gold-shimmer rounded-full animate-pulse-slow blur-sm"></div>
        <div className="hidden md:block absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-blue-400/15 to-purple-400/25 rounded-full animate-bounce-in blur-sm"></div>
        <div className="hidden lg:block absolute top-1/2 right-1/4 w-32 h-32 bg-gradient-to-br from-yellow-300/10 to-orange-300/15 rounded-full animate-pulse blur-lg"></div>
        
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 relative">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div className="text-center lg:text-left animate-fade-in">
              <div className="mb-4 sm:mb-6 md:mb-8">
                <span className="luxury-text-gradient font-luxury text-sm sm:text-base md:text-lg lg:text-xl tracking-wide flex items-center justify-center lg:justify-start gap-2">
                  <Sparkles size={16} className="text-yellow-500 sm:w-5 sm:h-5" />
                  Excellence in Luxury Education
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-luxury text-gray-800 mb-4 sm:mb-6 md:mb-8 leading-tight">
                Welcome to <span className="gold-shimmer bg-clip-text text-transparent font-luxury">EduVerse</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 md:mb-10 leading-relaxed font-elegant px-2 sm:px-0">
                Empowering global citizens through unparalleled excellence in education, fostering 
                creativity, critical thinking, and cultural understanding in our prestigious learning community.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center lg:justify-start px-4 sm:px-0">
                <Link href="/programs">
                  <Button className="luxury-button text-white px-6 sm:px-8 md:px-10 lg:px-12 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-luxury hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-yellow-300/30 flex items-center gap-2 justify-center w-full sm:w-auto">
                    <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                    Explore Our Curriculum
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button className="premium-glass border-2 border-yellow-400/50 text-yellow-700 hover:bg-yellow-50 px-6 sm:px-8 md:px-10 lg:px-12 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-luxury hover:scale-105 transition-all duration-300 shadow-xl backdrop-blur-sm flex items-center gap-2 justify-center w-full sm:w-auto">
                    <Gem size={16} className="sm:w-[18px] sm:h-[18px]" />
                    Schedule a Private Tour
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative animate-slide-up mt-8 lg:mt-0">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                  alt="Diverse students learning together in modern classroom" 
                  className="rounded-2xl sm:rounded-3xl creative-shadow w-full hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-2xl sm:rounded-3xl"></div>
                
              </div>
              <Card className="absolute -bottom-4 sm:-bottom-6 md:-bottom-8 -left-2 sm:-left-4 md:-left-8 luxury-card border-0 animate-bounce-in">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 gold-shimmer rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Award className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="font-luxury text-sm sm:text-base md:text-lg lg:text-xl text-gray-800">🏆 IB Accredited</p>
                      <p className="text-xs sm:text-sm text-yellow-600 font-premium">Prestigious Excellence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Stats Section with Moving Images */}
          <div className="mt-12 sm:mt-16 md:mt-20 relative">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 relative z-10">
            <Card className="luxury-card text-center hover:scale-105 transition-all duration-500 animate-bounce-in border-0">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 md:mb-4">🌍</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-luxury text-yellow-600 mb-1 sm:mb-2 md:mb-3">1,200+</div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 font-premium">Global Students</p>
              </CardContent>
            </Card>
            <Card className="luxury-card text-center hover:scale-105 transition-all duration-500 animate-bounce-in border-0">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 md:mb-4">🗺️</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-luxury text-yellow-600 mb-1 sm:mb-2 md:mb-3">45</div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 font-premium">Countries</p>
              </CardContent>
            </Card>
            <Card className="luxury-card text-center hover:scale-105 transition-all duration-500 animate-bounce-in border-0">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <UserCircle size={32} className="mx-auto mb-2 sm:mb-3 md:mb-4 text-eduverse-blue sm:w-10 sm:h-10 md:w-12 md:h-12" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-luxury text-yellow-600 mb-1 sm:mb-2 md:mb-3">150+</div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 font-premium">Expert Teachers</p>
              </CardContent>
            </Card>
            <Card className="luxury-card text-center hover:scale-105 transition-all duration-500 animate-bounce-in border-0">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <BookOpen size={32} className="mx-auto mb-2 sm:mb-3 md:mb-4 text-eduverse-blue sm:w-10 sm:h-10 md:w-12 md:h-12" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-luxury text-yellow-600 mb-1 sm:mb-2 md:mb-3">25+</div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 font-premium">Programs</p>
              </CardContent>
            </Card>
          </div>
          
        </div>
        </div>
      </section>

      {/* Quick Overview Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative overflow-hidden">
        {/* Background Elements with Moving Images - Hidden on mobile */}
        <div className="hidden sm:block absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-full opacity-10 animate-float" style={{background: 'linear-gradient(to right, #1e40af, #D4AF37)'}}></div>
        <div className="hidden sm:block absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-10 animate-pulse-slow"></div>
        
        
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-10 sm:mb-16 md:mb-20 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-gray-800 mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Gem size={32} className="text-yellow-500 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              <span>Why Choose <span className="gold-shimmer bg-clip-text text-transparent font-luxury">EduVerse</span>?</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto font-elegant leading-relaxed px-4 sm:px-0">
              Discover what makes our prestigious educational community exceptional and transformative for discerning families.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="luxury-card text-center hover:scale-105 transition-all duration-500 border-0 animate-slide-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-300/20 to-blue-300/20 rounded-full blur-lg"></div>
              <CardContent className="p-10 relative z-10">
                <div className="w-24 h-24 gold-shimmer rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Globe className="text-white" size={40} />
                </div>
                <h3 className="text-3xl font-luxury text-gray-800 mb-6">Global Perspective</h3>
                <p className="text-gray-600 leading-relaxed text-lg font-elegant">
                  Students from 45+ countries create a truly diverse learning environment 
                  that prepares graduates for success in our interconnected world.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-0 animate-slide-up">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                  <BookOpen className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Rigorous Academics</h3>
                <p className="text-gray-600 leading-relaxed">
                  IB and IGCSE programs provide world-class education with inquiry-based learning 
                  and critical thinking at the core of our curriculum.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-0 animate-slide-up">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                  <Users className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Supportive Community</h3>
                <p className="text-gray-600 leading-relaxed">
                  Small class sizes and dedicated teachers ensure personalized attention 
                  and support for every student's individual learning journey.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/about">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-transform px-10 py-4 rounded-xl creative-shadow flex items-center gap-2 mx-auto">
                <Sparkles size={18} />
                Learn More About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Subjects Showcase Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Background Elements with Moving Pictures */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-5 animate-float"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-5 animate-pulse-slow"></div>
        
        
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
              <BookOpen size={40} className="text-yellow-600" />
              Explore Our <span className="text-eduverse-gold font-bold" style={{color: '#D4AF37'}}>Subjects</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive curriculum designed to inspire curiosity and foster academic excellence across all disciplines.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Calculator size={40} className="mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Mathematics</h3>
                <p className="text-sm text-gray-600">Algebra, Geometry, Calculus, Statistics</p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <FlaskConical size={40} className="mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Sciences</h3>
                <p className="text-sm text-gray-600">Physics, Chemistry, Biology, Environmental</p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Languages size={40} className="mx-auto mb-4 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Languages</h3>
                <p className="text-sm text-gray-600">English, Spanish, French, Mandarin</p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Palette size={40} className="mx-auto mb-4 text-pink-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Arts</h3>
                <p className="text-sm text-gray-600">Visual Arts, Music, Drama, Digital Media</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Globe size={40} className="mx-auto mb-4 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Social Studies</h3>
                <p className="text-sm text-gray-600">History, Geography, Economics, Psychology</p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Laptop size={40} className="mx-auto mb-4 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Technology</h3>
                <p className="text-sm text-gray-600">Computer Science, Robotics, Digital Design</p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Dumbbell size={40} className="mx-auto mb-4 text-red-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Physical Education</h3>
                <p className="text-sm text-gray-600">Sports, Health, Wellness, Fitness</p>
              </CardContent>
            </Card>
            
            <Card className="text-center creative-shadow hover:scale-105 transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 animate-slide-up">
              <CardContent className="p-6">
                <Lightbulb size={40} className="mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Life Skills</h3>
                <p className="text-sm text-gray-600">Critical Thinking, Leadership, Communication</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Link href="/subjects">
              <Button className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:scale-105 transition-transform px-12 py-4 rounded-xl creative-shadow flex items-center gap-2 mx-auto">
                <Rocket size={18} />
                Explore All Subjects
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
