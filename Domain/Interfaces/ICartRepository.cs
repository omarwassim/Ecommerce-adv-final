using System;
using System.Collections.Generic;
using System.Text;
using EcommerceSystem.Domain.Entities;

namespace EcommerceSystem.Domain.Interfaces;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task AddAsync(Cart cart, CancellationToken ct = default);
    void Update(Cart cart);
}
