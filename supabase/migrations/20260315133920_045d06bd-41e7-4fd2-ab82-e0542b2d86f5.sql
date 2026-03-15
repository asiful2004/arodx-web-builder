
INSERT INTO public.site_settings (key, value) VALUES
('hero', '{
  "badge": "Digital Agency",
  "title_prefix": "We Are",
  "title_brand": "Arodx",
  "subtitle": "স্বপ্ন আপনার, বাস্তবে রূপ দেবো আমরা।",
  "description": "Creative design, development এবং marketing সবকিছু এক ছাদের নিচে।",
  "cta_primary_text": "Get Started",
  "cta_primary_link": "#pricing",
  "cta_secondary_text": "আমাদের কাজ দেখুন",
  "cta_secondary_link": "#portfolio"
}'::jsonb),
('about', '{
  "badge": "About Us",
  "title": "আমরা",
  "title_brand": "Arodx",
  "description1": "Arodx একটি ফুল-সার্ভিস ডিজিটাল এজেন্সি। আমরা ছোট-বড় সব ধরনের ব্যবসাকে অনলাইনে প্রতিষ্ঠিত করতে সাহায্য করি। আমাদের টিম ক্রিয়েটিভ ডিজাইন, ওয়েব ডেভেলপমেন্ট এবং ডিজিটাল মার্কেটিং — সবকিছুতে পারদর্শী।",
  "description2": "আমাদের মিশন হলো বাংলাদেশের প্রতিটি ব্যবসাকে ডিজিটাল দুনিয়ায় সফল করা। আমরা বিশ্বাস করি, সঠিক ডিজিটাল স্ট্র্যাটেজি যেকোনো ব্যবসাকে নতুন উচ্চতায় নিয়ে যেতে পারে।",
  "stats": [
    {"number": "50+", "label": "সম্পন্ন প্রজেক্ট"},
    {"number": "30+", "label": "সন্তুষ্ট ক্লায়েন্ট"},
    {"number": "3+", "label": "বছরের অভিজ্ঞতা"},
    {"number": "24/7", "label": "সাপোর্ট"}
  ],
  "values": [
    {"title": "আমাদের লক্ষ্য", "description": "প্রতিটি ব্র্যান্ডকে ডিজিটাল দুনিয়ায় সফল করা এবং তাদের গ্রোথ নিশ্চিত করা।"},
    {"title": "মানসম্মত কাজ", "description": "আমরা প্রতিটি প্রজেক্টে সর্বোচ্চ মানের কাজ ডেলিভার করি, কোনো কম্প্রোমাইজ নেই।"},
    {"title": "ক্লায়েন্ট সন্তুষ্টি", "description": "ক্লায়েন্টের সন্তুষ্টি আমাদের সবচেয়ে বড় অর্জন। ১০০% সাপোর্ট গ্যারান্টি।"},
    {"title": "দক্ষ টিম", "description": "অভিজ্ঞ ডিজাইনার, ডেভেলপার ও মার্কেটারদের একটি সমন্বিত টিম।"}
  ]
}'::jsonb),
('services', '{
  "badge": "Our Services",
  "title": "আমরা যা",
  "title_highlight": "করি",
  "items": [
    {"title": "Web Development", "description": "আধুনিক ও রেসপন্সিভ ওয়েবসাইট তৈরি করি যা আপনার ব্যবসাকে অনলাইনে নিয়ে যায়।", "icon": "Globe"},
    {"title": "Digital Marketing", "description": "SEO, Social Media ও Ads ক্যাম্পেইনের মাধ্যমে আপনার ব্যবসা বাড়াই।", "icon": "TrendingUp"},
    {"title": "Video Editing", "description": "প্রফেশনাল ভিডিও এডিটিং সার্ভিস যা আপনার কন্টেন্টকে আকর্ষণীয় করে তোলে।", "icon": "Video"},
    {"title": "Business Automation", "description": "আপনার ব্যবসার প্রসেস অটোমেট করে সময় ও খরচ বাঁচান।", "icon": "Settings"},
    {"title": "Brand Strategy", "description": "আপনার ব্র্যান্ডের জন্য সঠিক স্ট্র্যাটেজি তৈরি করি।", "icon": "Megaphone"},
    {"title": "Graphics & UI/UX Design", "description": "লোগো, ব্যানার, সোশ্যাল মিডিয়া পোস্ট ও অ্যাপ/ওয়েব UI ডিজাইন করি যা আপনার ব্র্যান্ডকে আলাদা করে তোলে।", "icon": "PenTool"}
  ]
}'::jsonb),
('pricing', '{
  "badge": "Pricing",
  "title": "আমাদের",
  "title_highlight": "প্যাকেজ",
  "subtitle": "আপনার বাজেট ও প্রয়োজন অনুযায়ী সেরা প্যাকেজ বেছে নিন",
  "packages": [
    {
      "name": "Starter",
      "regularPrice": "2,500",
      "firstYearPrice": "1,500",
      "regularYearlyPrice": "25,000",
      "firstYearYearlyPrice": "15,000",
      "currency": "৳",
      "description": "ছোট ব্যবসার জন্য পারফেক্ট শুরু",
      "popular": false,
      "features": ["Website + ১টি Landing Page (Hosting সহ)", "Basic Maintenance & Support", "মাসে ২টি Video Edit", "Basic SEO Setup", "১টি Social Media Management", "Basic Brand Guidelines"]
    },
    {
      "name": "Business",
      "regularPrice": "5,500",
      "firstYearPrice": "3,500",
      "regularYearlyPrice": "55,000",
      "firstYearYearlyPrice": "35,000",
      "currency": "৳",
      "description": "গ্রোয়িং ব্যবসার জন্য সেরা চয়েস",
      "popular": true,
      "features": ["Website + ৫টি Landing Page (Hosting সহ)", "Full Maintenance & Technical Support", "মাসে ৫টি Video Edit", "Advanced SEO + Ad Campaign", "৩টি Social Media Management", "Brand Strategy & Logo Optimization", "Monthly Graphics Package", "Basic Business Automation"]
    },
    {
      "name": "Enterprise",
      "regularPrice": "9,999",
      "firstYearPrice": "8,500",
      "regularYearlyPrice": "99,990",
      "firstYearYearlyPrice": "85,000",
      "currency": "৳",
      "description": "বড় ব্র্যান্ড ও কোম্পানির জন্য",
      "popular": false,
      "features": ["Website + ১০টি Landing Page (Hosting সহ)", "Free .com Domain (১ বছরের জন্য)", "Priority Technical Support & Maintenance", "Unlimited Video Editing", "Complete Digital Marketing (SEO, Ads, Organic)", "All Social Media Management", "Complete Brand Identity & Strategy", "Premium Graphics & UI/UX Design", "Advanced Business Automation", "Dedicated Account Manager"]
    }
  ],
  "custom_cta_text": "আপনার প্রয়োজন অনুযায়ী Custom Package বানাতে চান?",
  "custom_cta_description": "আমাদের টিমের সাথে যোগাযোগ করুন এবং আপনার বাজেট ও চাহিদা অনুযায়ী প্যাকেজ তৈরি করুন।"
}'::jsonb),
('contact', '{
  "badge": "Contact",
  "title": "যোগাযোগ",
  "title_highlight": "করুন",
  "subtitle": "আপনার প্রজেক্ট নিয়ে কথা বলতে চান? আমাদের মেসেজ করুন!",
  "email": "arodxofficial@gmail.com",
  "phone": "+880 1XXX-XXXXXX",
  "address": "ঢাকা, বাংলাদেশ",
  "office_hours": {
    "sat_to_wed": "8:00 AM – 12:00 AM",
    "thursday": "8:00 AM – 5:00 PM",
    "friday": "বন্ধ"
  }
}'::jsonb),
('footer', '{
  "brand_name": "Arodx",
  "tagline": "Your Digital Growth Partner",
  "copyright_text": "Arodx. All rights reserved."
}'::jsonb),
('portfolio', '{
  "badge": "Portfolio",
  "title": "আমাদের",
  "title_highlight": "কাজ",
  "subtitle": "আমরা এ পর্যন্ত যেসব প্রজেক্ট সফলভাবে সম্পন্ন করেছি তার কিছু নমুনা।",
  "projects": [
    {"title": "E-Commerce Platform", "category": "Web Development", "description": "একটি সম্পূর্ণ ই-কমার্স প্ল্যাটফর্ম যেখানে পেমেন্ট ইন্টিগ্রেশন ও ইনভেন্টরি ম্যানেজমেন্ট আছে।", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"},
    {"title": "Restaurant Branding", "category": "UI/UX Design", "description": "একটি রেস্টুরেন্টের জন্য সম্পূর্ণ ব্র্যান্ডিং — লোগো, মেনু ডিজাইন ও ওয়েবসাইট।", "image": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop"},
    {"title": "Social Media Campaign", "category": "Digital Marketing", "description": "সোশ্যাল মিডিয়া ক্যাম্পেইন যা ক্লায়েন্টের সেলস ৩x বাড়িয়েছে।", "image": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop"}
  ]
}'::jsonb),
('comparison', '{
  "badge": "কেন আমরা?",
  "title_prefix": "লোক নিয়োগ vs",
  "title_highlight": "Arodx টিম",
  "subtitle": "একজন কর্মী নিয়োগ দিয়ে সব কাজ করানো বনাম আমাদের ডেডিকেটেড টিমের সাথে কাজ করা — পার্থক্যটা দেখুন নিজেই।",
  "hiring_title": "আলাদা লোক নিয়োগ দিলে",
  "arodx_title": "আমাদের প্যাকেজ কিনলে",
  "hiring_problems": [
    {"title": "উচ্চ বেতন ও খরচ", "description": "প্রতিটি পদের জন্য আলাদা বেতন, বোনাস, ট্রেনিং — মাসে ১০,০০০–১৫,০০০৳+ খরচ হতে পারে।"},
    {"title": "একজনের ওপর সব চাপ", "description": "একজন কর্মী একা ডিজাইন, ডেভেলপমেন্ট, মার্কেটিং সব সামলাতে গিয়ে মানসিক চাপে পড়ে — ফলাফল হয় দুর্বল।"},
    {"title": "ভুল ও দেরি বেশি", "description": "অতিরিক্ত কাজের চাপে ভুল বাড়ে, ডেডলাইন মিস হয়, ব্যবসার ক্ষতি হয়।"},
    {"title": "স্কিল গ্যাপ থাকে", "description": "একজন মানুষ সব বিষয়ে এক্সপার্ট হতে পারে না — কোনো না কোনো দিক দুর্বল থেকেই যায়।"}
  ],
  "arodx_benefits": [
    {"title": "ডেডিকেটেড টিম", "description": "আলাদা ডেভেলপার, ডিজাইনার, মার্কেটার ও প্রজেক্ট ম্যানেজার — প্রত্যেকে নিজ নিজ ক্ষেত্রে এক্সপার্ট।"},
    {"title": "নির্ভুল ও মানসম্মত কাজ", "description": "আলাদা ডেডিকেটেড লোক থাকায় কাজের চাপ কম, তাই প্রতিটি কাজ হয় নিখুঁত ও সময়মতো।"},
    {"title": "খরচ অনেক কম", "description": "একজন কর্মীর বেতনের চেয়ে কম খরচে পুরো একটি দক্ষ টিম পাচ্ছেন।"},
    {"title": "দ্রুত ও ঝামেলামুক্ত", "description": "হোস্টিং, মেইনটেন্যান্স, সাপোর্ট — সব দায়িত্ব আমাদের। আপনি শুধু ব্যবসায় ফোকাস করুন।"}
  ],
  "comparison_points": [
    {"feature": "মাসিক খরচ", "hiring": "১০,০০০–১৫,০০০৳+", "arodx": "১,৫০০–৯,৯৯৯৳"},
    {"feature": "টিম সাইজ", "hiring": "১ জন (সব কাজ একা)", "arodx": "৪-৫ জন বিশেষজ্ঞ"},
    {"feature": "কাজের মান", "hiring": "অনিশ্চিত", "arodx": "সর্বোচ্চ মান নিশ্চিত"},
    {"feature": "সাপোর্ট", "hiring": "অফিস আওয়ার্সে", "arodx": "24/7 সাপোর্ট"},
    {"feature": "স্কেলেবিলিটি", "hiring": "সীমিত", "arodx": "আনলিমিটেড"}
  ]
}'::jsonb),
('process', '{
  "badge": "How We Work",
  "title": "আমাদের কাজের",
  "title_highlight": "ধাপসমূহ",
  "subtitle": "প্রতিটি প্রজেক্টে ৪ জন ডেডিকেটেড বিশেষজ্ঞ কাজ করেন — তাই সবকিছু হয় নিখুঁত, সময়মতো এবং ঝামেলামুক্ত।",
  "bottom_cta": "সবকিছু এক টিমে — আপনি শুধু ব্যবসায় ফোকাস করুন, বাকিটা আমাদের দায়িত্ব।",
  "steps": [
    {"number": "01", "icon": "ClipboardCheck", "title": "প্রজেক্ট ম্যানেজার", "subtitle": "পরিকল্পনা ও সমন্বয়", "description": "আপনার প্রজেক্টের জন্য একজন ডেডিকেটেড প্রজেক্ট ম্যানেজার থাকেন যিনি পুরো কাজের পরিকল্পনা করেন, টাইমলাইন সেট করেন এবং টিমের সাথে সমন্বয় রাখেন। আপনাকে কোনো কিছু নিয়ে চিন্তা করতে হয় না।"},
    {"number": "02", "icon": "PenTool", "title": "গ্রাফিক্স ডিজাইনার", "subtitle": "ক্রিয়েটিভ ডিজাইন", "description": "ডেডিকেটেড ডিজাইনার আপনার ব্র্যান্ডের লোগো, ব্যানার, সোশ্যাল মিডিয়া পোস্ট এবং UI/UX ডিজাইন করেন — সম্পূর্ণ ফোকাস শুধু আপনার ব্র্যান্ডে।"},
    {"number": "03", "icon": "Code", "title": "ওয়েব ডেভেলপার", "subtitle": "ডেভেলপমেন্ট ও টেক", "description": "এক্সপার্ট ডেভেলপার আপনার ওয়েবসাইট তৈরি করেন, হোস্টিং সেটআপ করেন এবং টেকনিক্যাল সব কিছু সামলান। আপনার কোনো টেকনিক্যাল জ্ঞান লাগবে না।"},
    {"number": "04", "icon": "Megaphone", "title": "ডিজিটাল মার্কেটার", "subtitle": "মার্কেটিং ও গ্রোথ", "description": "ডেডিকেটেড মার্কেটার SEO, সোশ্যাল মিডিয়া ম্যানেজমেন্ট এবং অ্যাড ক্যাম্পেইন চালান — আপনার ব্যবসার গ্রোথ নিশ্চিত করতে।"}
  ]
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
