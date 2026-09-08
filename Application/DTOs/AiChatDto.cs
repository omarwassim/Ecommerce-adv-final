using System;
using System.Collections.Generic;
using System.Text;

namespace EcommerceSystem.Application.DTOs
{
 
        public class AiChatRequestDto
        {
            public string Query { get; set; } = string.Empty;
        }

        public class AiChatResponseDto
        {
            public string Answer { get; set; } = string.Empty;
        }
}
