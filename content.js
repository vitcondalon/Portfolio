/* ============================================================
   content.js — ONLY EDIT THIS FILE to update content
   Tất cả nội dung portfolio nằm ở đây.
   main.js sẽ đọc object này và dựng DOM.
   ============================================================ */

const CONTENT = {

  /* --- Thông tin cá nhân --- */
  name: "Lê Trí Việt",
  title: {
    en: "Cybersecurity Student",
    vi: "Sinh viên An ninh mạng"
  },
  tagline: {
    en: "Grounded in networking, learning to think like an attacker.",
    vi: "Nền tảng mạng vững chắc · Tư duy an ninh mạng hướng tấn công."
  },

  /* --- Liên hệ --- */
  contact: [
    {
      label: "GitHub",
      url: "https://github.com/vitcondalon",
      icon: "github"
    },
    {
      label: "LinkedIn",
      url: "#",   /* Thay '#' bằng link LinkedIn cá nhân khi sẵn sàng (vd: https://www.linkedin.com/in/letriviet) */
      icon: "linkedin"
    },
    {
      label: "Facebook",
      url: "https://www.facebook.com/l.t.viet.695531",
      icon: "facebook"
    },
    {
      label: "Email",
      email: "letriviet2005@gmail.com",
      url: "mailto:letriviet2005@gmail.com",
      icon: "email"
    }
  ],

  /* --- CV / Resume --- */
  cv: {
    label: { en: "Download CV", vi: "Tải CV" },
    url: "assets/LeTriViet_CV.pdf"
  },

  /* --- About --- */
  about: {
    en: [
      "I'm a fourth-year IT student at Dong Nai Technology University majoring in computer networking. Grounded in a solid CCNA foundation, I'm currently diving into offensive security and penetration testing — practicing core toolchains on Kali Linux and learning to think like an attacker through CTF challenges.",
      "My daily focus is building hands-on offensive capabilities: network enumeration, vulnerability discovery, and exploit fundamentals while understanding what happens under the hood. I competed in the Jeopardy Finals of the Cybersecurity Student Contest Vietnam 2026 (CSCV 2026) with team DNTU_SCURITY (ranked 29th out of 47 teams), and am actively advancing through TryHackMe attack paths."
    ],
    vi: [
      "Mình là sinh viên năm cuối ngành CNTT (chuyên ngành Mạng máy tính) tại Đại học Công nghệ Đồng Nai. Xuất phát từ nền tảng mạng CCNA vững chắc, mình hiện đang đào sâu vào an toàn thông tin theo hướng tấn công (Offensive Security / Pentest) — rèn luyện bộ công cụ thực chiến trên Kali Linux và rèn tư duy của kẻ tấn công qua các giải CTF.",
      "Trọng tâm hiện tại của mình là năng lực thực chiến: trinh sát mạng (recon), rà soát lỗ hổng và nắm rõ bản chất kỹ thuật của từng bước khai thác thay vì chỉ phụ thuộc vào công cụ tự động. Mình cùng đội thi DNTU_SCURITY đã lọt vào vòng chung khảo Jeopardy tại cuộc thi Sinh viên với An toàn thông tin 2026 (CSCV 2026), xếp hạng 29/47 đội và đang tiếp tục nâng cao kỹ năng qua các attack path trên TryHackMe."
    ]
  },

  /* --- Thành tích --- */
  achievements: {
    competitions: [
      {
        name: {
          en: "Cybersecurity Student Contest Vietnam 2026 (CSCV) — Jeopardy Finals",
          vi: "Sinh viên với An toàn thông tin 2026 (CSCV) — Chung khảo Jeopardy"
        },
        detail: {
          en: "Finalist (Rank 29th/47) · Team DNTU_SCURITY",
          vi: "Chung khảo (Hạng 29/47) · Đội DNTU_SCURITY"
        },
        year: "2026",
        link: "https://jeo.cscv.vn"
      },
      {
        name: { en: "Cisco NetAcad Riders 2025", vi: "Cisco NetAcad Riders 2025" },
        detail: { en: "Certificate of Participation", vi: "Chứng nhận tham gia" },
        year: "Mar – Apr 2025",
        link: null
      }
    ],
    certifications: [
      {
        name: "Junior Cybersecurity Analyst Career Path",
        issuer: "Cisco Networking Academy",
        date: "May 2026",
        link: "https://www.credly.com/badges/b4fbdc90-4ec7-49d7-85d5-651fd4058fe7"
      },
      {
        name: "CCNA: Introduction to Networks",
        issuer: "Cisco Networking Academy",
        date: "Jun 2026",
        link: "https://www.credly.com/badges/5abc16ff-9fc6-40d0-bde0-0f94be0b31f7"
      },
      {
        name: "CCNA: Switching, Routing, and Wireless Essentials",
        issuer: "Cisco Networking Academy",
        date: "May 2025",
        link: "https://www.credly.com/badges/7d005353-a4b0-42ea-bac9-a003311dd280"
      }
    ],
    modules: [
      "Vulnerability Assessment and Risk Management",
      "Incident Response",
      "Security Alerts",
      "Firewalls and Cloud Security",
      "Network Defense",
      "Operating System and Endpoint Security",
      "Network Security Basics"
    ],
    modulesDate: "Apr – May 2026"
  },

  /* --- Dự án --- */
  projects: [
    {
      name: "OKR / KPI HR Management System",
      type: { en: "Hackathon Project (Team of 4)", vi: "Dự án Hackathon (nhóm 4 người)" },
      role: { en: "Backend Developer", vi: "Backend Developer" },
      description: {
        en: "Built during a 1-day hackathon. A web-based HR performance management system supporting OKR and KPI workflows with role-based access control (Admin / HR / Manager / Employee). I handled the backend: REST API design, database schema, authentication, and Docker deployment.",
        vi: "Xây dựng trong 1 ngày hackathon. Hệ thống quản lý hiệu suất nhân sự hỗ trợ OKR và KPI với phân quyền 4 cấp (Admin / HR / Manager / Employee). Mình phụ trách backend: thiết kế REST API, database schema, xác thực, và triển khai Docker."
      },
      stack: ["Node.js", "PostgreSQL", "Docker", "Swagger API"],
      link: "https://github.com/vitcondalon/hackathon_OKR-_KPI"
    },
    {
      name: "LanFileTool",
      type: { en: "Personal Project", vi: "Dự án cá nhân" },
      role: { en: "Solo Developer", vi: "Tự làm" },
      description: {
        en: "A LAN file sharing tool for classroom environments without internet access. Built a custom binary protocol over TCP sockets with a GUI for both server and client sides. Supports multi-client connections via threading.",
        vi: "Công cụ chia sẻ file qua mạng LAN cho phòng máy không có internet. Tự thiết kế giao thức nhị phân trên TCP socket, có GUI cho cả server và client. Hỗ trợ đa client qua threading."
      },
      stack: ["Python", "TCP Socket", "tkinter", "PyInstaller"],
      link: "https://github.com/vitcondalon/LanFileTool"
    }
    /* Chừa sẵn slot cho dự án tiếp theo (ví dụ: Secure Network Lab):
    ,{
      name: "Secure Enterprise Network Lab",
      type: { en: "Hands-on Lab", vi: "Lab thực hành" },
      role: { en: "Network Security", vi: "Bảo mật mạng" },
      description: {
        en: "Configured enterprise topology with VLAN segmentation, ACLs, Port Security, and DHCP snooping on Cisco Packet Tracer.",
        vi: "Thiết kế topology doanh nghiệp với phân đoạn VLAN, ACL, Port Security, và DHCP snooping trên Cisco Packet Tracer."
      },
      stack: ["Cisco Packet Tracer", "ACL", "VLAN", "Port Security"],
      link: "#"
    }
    */
  ],

  /* --- Notes / Writeup --- */
  notes: [
    /* Chừa sẵn — điền khi có bài viết
    {
      title: "Tên bài",
      platform: "TryHackMe",
      tags: ["web", "enumeration"],
      date: "Oct 2026",
      url: "https://hackmd.io/..."
    }
    */
  ],

  /* --- Nav labels --- */
  nav: {
    about:        { en: "About",        vi: "Giới thiệu" },
    achievements: { en: "Achievements", vi: "Thành tích" },
    projects:     { en: "Projects",     vi: "Dự án" },
    notes:        { en: "Notes",        vi: "Ghi chú" }
  }

};
