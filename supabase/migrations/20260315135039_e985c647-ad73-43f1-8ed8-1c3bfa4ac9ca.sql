
UPDATE public.site_settings SET value = '{
  "brand_name": "Arodx",
  "tagline": "Your Digital Growth Partner",
  "copyright_text": "Arodx. All rights reserved.",
  "description": "আমরা ছোট-বড় সব ধরনের ব্যবসাকে অনলাইনে প্রতিষ্ঠিত করতে সাহায্য করি। ক্রিয়েটিভ ডিজাইন, ওয়েব ডেভেলপমেন্ট এবং ডিজিটাল মার্কেটিং — সবকিছু এক ছাদের নিচে।",
  "email": "arodxofficial@gmail.com",
  "phone": "+880 1XXX-XXXXXX",
  "address": "ঢাকা, বাংলাদেশ",
  "social_links": [
    {"platform": "Facebook", "url": "https://facebook.com/arodx", "icon": "Facebook"},
    {"platform": "Instagram", "url": "https://instagram.com/arodx", "icon": "Instagram"},
    {"platform": "Twitter", "url": "https://twitter.com/arodx", "icon": "Twitter"},
    {"platform": "YouTube", "url": "https://youtube.com/@arodx", "icon": "Youtube"}
  ],
  "quick_links": [
    {"label": "সার্ভিস", "url": "#services"},
    {"label": "প্যাকেজ", "url": "#pricing"},
    {"label": "পোর্টফোলিও", "url": "#portfolio"},
    {"label": "যোগাযোগ", "url": "#contact"}
  ],
  "service_links": [
    {"label": "Web Development", "url": "#services"},
    {"label": "Digital Marketing", "url": "#services"},
    {"label": "Graphics Design", "url": "#services"},
    {"label": "Video Editing", "url": "#services"},
    {"label": "Brand Strategy", "url": "#services"}
  ]
}'::jsonb WHERE key = 'footer';
