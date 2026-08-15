import type { SampleVideo, VoiceConfig } from '../types/video';

export const SAMPLE_CHINESE_VIDEOS: SampleVideo[] = [
  {
    id: 'sample-food',
    title: 'Ẩm thực Douyin: Bí quyết nấu Đậu hũ Tứ Xuyên trứ danh',
    category: 'Ẩm thực Douyin',
    duration: 38,
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Video ngắn Douyin hướng dẫn công thức làm đậu hũ Ma Bà siêu cay chuẩn vị Tứ Xuyên.',
    subtitles: [
      {
        id: 'sub-1',
        startTime: 0.5,
        endTime: 3.8,
        chineseText: '大家好，今天教大家做一道正宗的四川麻婆豆腐。',
        pinyin: 'Dàjiā hǎo, jīntiān jiào dàjiā zuò yī dào zhèngzōng de Sìchuān mápó dòufu.',
        vietnameseText: 'Chào cả nhà, hôm nay mình sẽ hướng dẫn các bạn làm món Đậu Hũ Ma Bà chuẩn vị Tứ Xuyên nhé.',
        voiceGender: 'female'
      },
      {
        id: 'sub-2',
        startTime: 4.2,
        endTime: 8.5,
        chineseText: '首先把豆腐切成两厘米见方的小块，冷水下锅焯水两分钟。',
        pinyin: 'Shǒuxiān bǎ dòufu qiē chéng liǎng límǐ jiànfāng de xiǎo kuài, lěngshuǐ xià guō chāoshuǐ liǎng fēnzhōng.',
        vietnameseText: 'Đầu tiên, cắt đậu hũ thành từng khối vuông nhỏ khoảng 2cm, cho vào nồi nước lạnh chần sơ 2 phút.',
        voiceGender: 'female'
      },
      {
        id: 'sub-3',
        startTime: 9.0,
        endTime: 14.2,
        chineseText: '热锅下入菜籽油，煸炒牛肉碎，一定要炒到干香酥脆。',
        pinyin: 'Rè guō xià rù càizǐyóu, biān chǎo niúròu suì, yídìng yào chǎo dào gān xiāng sūcuì.',
        vietnameseText: 'Làm nóng chảo với dầu hạt cải, xào săn thịt bò băm cho đến khi dậy mùi thơm và giòn rụm.',
        voiceGender: 'female'
      },
      {
        id: 'sub-4',
        startTime: 14.8,
        endTime: 20.5,
        chineseText: '接着加入郫县豆瓣酱和花椒粉，小火炒出漂亮的红油。',
        pinyin: 'Jiēzhe jiārù Píxiàn dòubànjiàng hé huājiāofěn, xiǎohuǒ chǎo chū piàoliang de hóngyóu.',
        vietnameseText: 'Tiếp tục cho tương ớt Pixian và bột hoa tiêu vào, đảo lửa nhỏ để tạo màu dầu đỏ óng ánh đẹp mắt.',
        voiceGender: 'female'
      },
      {
        id: 'sub-5',
        startTime: 21.0,
        endTime: 27.5,
        chineseText: '倒入高汤下入豆腐，焖煮三分钟，分三次勾芡收汁。',
        pinyin: 'Dàorù gāotāng xià rù dòufu, mèn zhǔ sān fēnzhōng, fēn sān cì gōuqian shōu zhī.',
        vietnameseText: 'Đổ nước dùng vào, cho đậu hũ nấu liu riu 3 phút, sau đó rưới nước bột năng làm 3 lần cho sánh lại.',
        voiceGender: 'female'
      },
      {
        id: 'sub-6',
        startTime: 28.0,
        endTime: 34.2,
        chineseText: '出锅前撒上一把蒜苗叶，麻辣鲜香，真的太下饭了！',
        pinyin: 'Chū guō qián sǎ shàng yī bǎ suànmiáo yè, málà xiān xiāng, zhēn de tài xiàfàn le!',
        vietnameseText: 'Trước khi múc ra đĩa, rắc một nắm lá tỏi tây lên. Vị cay tê thơm lừng, ăn cực kỳ đưa cơm luôn!',
        voiceGender: 'female'
      },
      {
        id: 'sub-7',
        startTime: 34.6,
        endTime: 37.5,
        chineseText: '记得点赞收藏，赶紧回家试试吧！',
        pinyin: 'Jìde diǎnzàn shōucáng, gǎnjǐn huíjiā shìshì ba!',
        vietnameseText: 'Đừng quên bấm like và lưu lại để tối nay làm thử ngay nhé!',
        voiceGender: 'female'
      }
    ]
  },
  {
    id: 'sample-tech',
    title: 'Review Công nghệ: Trải nghiệm kính thực tế ảo thông minh AI',
    category: 'Review Công nghệ',
    duration: 35,
    thumbnail: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'Video bóc hộp và đánh giá nhanh thiết bị công nghệ đeo thông minh thế hệ mới.',
    subtitles: [
      {
        id: 'tech-1',
        startTime: 0.5,
        endTime: 4.5,
        chineseText: '朋友们，今天带大家看一款刚发布的全新AI智能眼镜。',
        pinyin: 'Péngyoumen, jīntiān dài dàjiā kàn yī kuǎn gāng fābù de quánxīn AI zhìnéng yǎnjìng.',
        vietnameseText: 'Chào anh em, hôm nay mình trên tay một chiếc kính thông minh tích hợp AI vừa mới ra mắt.',
        voiceGender: 'male'
      },
      {
        id: 'tech-2',
        startTime: 5.0,
        endTime: 9.8,
        chineseText: '它的重量只有48克，戴在脸上几乎感觉不到任何负担。',
        pinyin: 'Tā de zhòngliàng zhǐyǒu 48 kè, dài zài liǎn shàng jīhū gǎnjué bù dào rènhé fùdān.',
        vietnameseText: 'Trọng lượng của nó chỉ vỏn vẹn 48 gram, đeo lên mặt gần như không cảm thấy vướng víu gì.',
        voiceGender: 'male'
      },
      {
        id: 'tech-3',
        startTime: 10.2,
        endTime: 16.0,
        chineseText: '最厉害的是它的实时同声传译功能，支持十多种语言秒级翻译。',
        pinyin: 'Zuì lìhai de shì tā de shíshí tóngshēng chuányì gōngnéng, zhīchí shí duō zhǒng yǔyán miǎo jí fānyì.',
        vietnameseText: 'Đỉnh nhất là tính năng dịch song song thời gian thực, hỗ trợ hơn 10 ngôn ngữ với tốc độ phản hồi tính bằng giây.',
        voiceGender: 'male'
      },
      {
        id: 'tech-4',
        startTime: 16.5,
        endTime: 22.0,
        chineseText: '镜腿内置了微型骨传导扬声器，音质清晰而且完全不漏音。',
        pinyin: 'Jìngtuǐ nèizhì le wēixíng gǔchuándǎo yángshēngqì, yīnlì qīngxī érqiě wánquán bù lòuyīn.',
        vietnameseText: 'Gọng kính tích hợp loa truyền xương siêu nhỏ, âm thanh cực trong trẻo và hoàn toàn không bị rò rỉ âm thanh ra ngoài.',
        voiceGender: 'male'
      },
      {
        id: 'tech-5',
        startTime: 22.5,
        endTime: 28.5,
        chineseText: '续航方面连续使用可以达到8个小时，日常通勤完全足够。',
        pinyin: 'Xùháng fāngmiàn liánxù shǐyòng kěyǐ dádào 8 gè xiǎoshí, rìcháng tōngqín wánquán zúgòu.',
        vietnameseText: 'Thời lượng pin sử dụng liên tục có thể lên đến 8 tiếng, quá đủ cho nhu cầu làm việc và di chuyển cả ngày.',
        voiceGender: 'male'
      },
      {
        id: 'tech-6',
        startTime: 29.0,
        endTime: 34.0,
        chineseText: '你觉得这款黑科技产品怎么样？欢迎在评论区留言讨论！',
        pinyin: 'Nǐ juéde zhè kuǎn hēikējì chǎnpǐn zěnmeyàng? Huānyíng zài pínglùnqū liúyán tǎolùn!',
        vietnameseText: 'Các bạn thấy món đồ công nghệ này thế nào? Hãy để lại ý kiến dưới phần bình luận nhé!',
        voiceGender: 'male'
      }
    ]
  },
  {
    id: 'sample-drama',
    title: 'Phim ngắn Douyin: Cuộc hội ngộ bất ngờ',
    category: 'Phim ngắn & Kịch tính',
    duration: 32,
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Trích đoạn phim ngắn Douyin tình cảm hồi hộp với đối thoại kịch tính.',
    subtitles: [
      {
        id: 'drama-1',
        startTime: 0.5,
        endTime: 4.2,
        chineseText: '三年了，我以为再也不会在这个城市遇见你。',
        pinyin: 'Sān nián le, wǒ yǐwéi zài yě bù huì zài zhège chéngshì yùjiàn nǐ.',
        vietnameseText: 'Ba năm rồi, tôi cứ ngỡ sẽ chẳng bao giờ gặp lại em ở thành phố này nữa.',
        voiceGender: 'male'
      },
      {
        id: 'drama-2',
        startTime: 4.8,
        endTime: 8.9,
        chineseText: '顾总，您认错人了，我们现在只是普通的工作关系。',
        pinyin: 'Gù zǒng, nín rèn cuò rén le, wǒmen xiànzài zhǐshì pǔtōng de gōngzuò guānxi.',
        vietnameseText: 'Cố tổng, anh nhận nhầm người rồi. Giữa chúng ta bây giờ chỉ là quan hệ công việc thuần túy.',
        voiceGender: 'female'
      },
      {
        id: 'drama-3',
        startTime: 9.5,
        endTime: 15.0,
        chineseText: '当年发生的一切都是个误会，你为什么就是不肯听我解释？',
        pinyin: 'Dāngnián fāshēng de yíqiè dōushì gè wùhuì, nǐ wèishénme jiùshì bù kěn tīng wǒ jiěshì?',
        vietnameseText: 'Tất cả mọi chuyện năm đó chỉ là một sự hiểu lầm, tại sao em không chịu nghe anh giải thích?',
        voiceGender: 'male'
      },
      {
        id: 'drama-4',
        startTime: 15.6,
        endTime: 21.2,
        chineseText: '有些事情错过了就是一辈子，过去的事就让它过去吧。',
        pinyin: 'Yǒuxiē shìqing cuòguò le jiùshì yībèizi, guòqù de shì jiù ràng tā guòqù ba.',
        vietnameseText: 'Có những điều một khi đã bỏ lỡ là lỡ cả một đời. Chuyện quá khứ hãy để nó trôi qua đi.',
        voiceGender: 'female'
      },
      {
        id: 'drama-5',
        startTime: 21.8,
        endTime: 27.5,
        chineseText: '如果我说，为了找你，我愿意放弃现在所拥有的一切呢？',
        pinyin: 'Rúguǒ wǒ shuō, wèile zhǎo nǐ, wǒ yuànyì fàngqì xiànzài suǒ yǒngyǒu de yíqiè ne?',
        vietnameseText: 'Nếu anh nói rằng, chỉ để tìm lại em, anh sẵn sàng buông bỏ tất cả những gì anh đang có thì sao?',
        voiceGender: 'male'
      },
      {
        id: 'drama-6',
        startTime: 28.0,
        endTime: 31.5,
        chineseText: '请自重，明天的签约仪式上见。',
        pinyin: 'Qǐng zìzhòng, míngtiān de qiānyuē yíshì shàng jiàn.',
        vietnameseText: 'Xin anh tự trọng. Hẹn gặp lại anh tại buổi lễ ký kết ngày mai.',
        voiceGender: 'female'
      }
    ]
  },
  {
    id: 'sample-vlog',
    title: 'Vlog Thượng Hải: Khám phá chợ đêm và ẩm thực đường phố',
    category: 'Vlog & Du lịch',
    duration: 30,
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    description: 'Vlog dạo phố khám phá không khí lung linh và ẩm thực đường phố về đêm.',
    subtitles: [
      {
        id: 'vlog-1',
        startTime: 0.5,
        endTime: 4.8,
        chineseText: '哈喽大家晚上好，我现在来到了上海最热闹的外滩夜市。',
        pinyin: 'Hālóu dàjiā wǎnshang hǎo, wǒ xiànzài lái dào le Shànghǎi zuì rènao de Wàitān yèshì.',
        vietnameseText: 'Hello cả nhà buổi tối, hiện tại mình đang có mặt tại khu chợ đêm Bến Thượng Hải nhộn nhịp nhất.',
        voiceGender: 'female'
      },
      {
        id: 'vlog-2',
        startTime: 5.2,
        endTime: 10.0,
        chineseText: '这里的霓虹灯真的太漂亮了，到处都是各种特色小吃。',
        pinyin: 'Zhèlǐ de níhóngdēng zhēn de tài piàoliang le, dàochù dōushì gè zhǒng tèsè xiǎochī.',
        vietnameseText: 'Ánh đèn neon ở đây lung linh tuyệt đẹp, khắp nơi tràn ngập các món ăn vặt đặc sắc.',
        voiceGender: 'female'
      },
      {
        id: 'vlog-3',
        startTime: 10.5,
        endTime: 16.0,
        chineseText: '看这家生煎包排了好长的队，底壳焦脆，咬一口爆汁！',
        pinyin: 'Kàn zhè jiā shēngjiānbāo pái le hǎo cháng de duì, dǐké jiāocuì, yǎo yīkǒu bàozhī!',
        vietnameseText: 'Nhìn quán bánh bao chiên này xếp hàng dài ghê, đế bánh giòn rụm, cắn một miếng nước sốt tràn ngập miệng!',
        voiceGender: 'female'
      },
      {
        id: 'vlog-4',
        startTime: 16.5,
        endTime: 22.2,
        chineseText: '晚风吹在脸上特别舒服，江边的夜景真的百看不厌。',
        pinyin: 'Wǎnfēng chuī zài liǎn shàng tèbié shūfu, jiāngbiān de yèjǐng zhēn de bǎi kàn bù yàn.',
        vietnameseText: 'Gió đêm thổi vào mặt mát rượi dễ chịu, cảnh đêm bên bờ sông Hoàng Phố ngắm mãi không biết chán.',
        voiceGender: 'female'
      },
      {
        id: 'vlog-5',
        startTime: 22.8,
        endTime: 29.2,
        chineseText: '如果你也来上海玩，一定要来这里感受一下人间烟火气！',
        pinyin: 'Rúguǒ nǐ yě lái Shànghǎi wán, yídìng yào lái zhèlǐ gǎnshòu yíxià rénjiān yānhuǒqì!',
        vietnameseText: 'Nếu bạn có dịp đến Thượng Hải, nhất định phải ghé qua đây để cảm nhận trọn vẹn nhịp sống sôi động này nhé!',
        voiceGender: 'female'
      }
    ]
  }
];

export const VIETNAMESE_VOICES: VoiceConfig[] = [
  {
    id: 'vi-cloud-female',
    name: 'Mai Hương (Hà Nội - Nữ Chuẩn)',
    region: 'north',
    gender: 'female',
    description: 'Giọng đọc AI trực tuyến truyền cảm, tự nhiên, thích hợp vlog và ẩm thực',
    engine: 'cloud',
    langCode: 'vi-VN'
  },
  {
    id: 'vi-cloud-male',
    name: 'Mạnh Cường (Hà Nội - Nam Trầm)',
    region: 'north',
    gender: 'male',
    description: 'Giọng đọc AI trầm ấm, uy lực, thích hợp review công nghệ, tin tức và vlog',
    engine: 'cloud',
    langCode: 'vi-VN'
  },
  {
    id: 'vi-central-female-1',
    name: 'Ánh Nguyệt (Huế / Miền Trung - Nữ)',
    region: 'central',
    gender: 'female',
    description: 'Giọng đọc miền Trung dịu dàng, sâu lắng, truyền cảm cho video du lịch & tâm sự',
    engine: 'cloud',
    langCode: 'vi-VN'
  },
  {
    id: 'vi-south-female-1',
    name: 'Thảo Nhi (Sài Gòn - Nữ Tươi Vui)',
    region: 'south',
    gender: 'female',
    description: 'Giọng đọc tươi vui, trẻ trung dành cho video Douyin ẩm thực & giải trí',
    engine: 'cloud',
    langCode: 'vi-VN'
  },
  {
    id: 'vi-south-male-1',
    name: 'Bảo Long (Sài Gòn - Nam Năng Động)',
    region: 'south',
    gender: 'male',
    description: 'Giọng đọc miền Nam năng động, tự nhiên, cuốn hút cho video phim ngắn',
    engine: 'cloud',
    langCode: 'vi-VN'
  },
  {
    id: 'vi-story-male',
    name: 'Thanh Tùng (Điện Ảnh / Review Phim - Nam)',
    region: 'special',
    gender: 'male',
    description: 'Giọng đọc điện ảnh hào hùng, lôi cuốn cho video tóm tắt phim & truyện kiếm hiệp Douyin',
    engine: 'cloud',
    langCode: 'vi-VN'
  },
  {
    id: 'vi-youth-female',
    name: 'Minh Thư (Douyin Gen Z / Bắt Trend - Nữ)',
    region: 'special',
    gender: 'female',
    description: 'Giọng đọc sôi động, bắt trend, cực kỳ cuốn hút cho review thời trang, mỹ phẩm và đồ ăn vặt',
    engine: 'cloud',
    langCode: 'vi-VN'
  }
];
