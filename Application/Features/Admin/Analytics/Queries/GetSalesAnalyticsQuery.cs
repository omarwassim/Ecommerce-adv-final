using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Analytics.Queries;

/// <summary>TopN caps the "most sold" list; pass null to return the full distribution.</summary>
public sealed record GetSalesAnalyticsQuery(int? TopN = null) : IRequest<SalesAnalyticsDto>;
