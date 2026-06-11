# Migration script: Copy and transform Backend sources to microservices
# This script copies files from Backend to microservices with package renaming
# From: com.ecommerce.* 
# To: com.naturessence.shared.* (for shared-lib), com.naturessence.{service}.* (for services)

$backendDir = ".\Backend\src\main\java\com\ecommerce"
$microservicesDir = ".\microservices"

# Ensure directories exist
@(
    "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\entity",
    "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\enums",
    "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\repository",
    "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\dto\request",
    "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\dto\response",
    "$microservicesDir\shared-lib\src\main\resources",
    "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\security",
    "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\config",
    "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\service",
    "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\controller",
    "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\exception",
    "$microservicesDir\auth-service\src\main\resources",
    "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\service",
    "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\controller",
    "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\security",
    "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\config",
    "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\exception",
    "$microservicesDir\catalog-service\src\main\resources",
    "$microservicesDir\order-service\src\main\java\com\naturessence\order\service",
    "$microservicesDir\order-service\src\main\java\com\naturessence\order\controller",
    "$microservicesDir\order-service\src\main\java\com\naturessence\order\security",
    "$microservicesDir\order-service\src\main\java\com\naturessence\order\config",
    "$microservicesDir\order-service\src\main\java\com\naturessence\order\exception",
    "$microservicesDir\order-service\src\main\resources",
    "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\service",
    "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\controller",
    "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\security",
    "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\config",
    "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\exception",
    "$microservicesDir\marketing-service\src\main\resources",
    "$microservicesDir\api-gateway\src\main\resources"
) | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
}

Write-Host "✓ Directory structure created"

# Function to copy and transform a file
function Copy-WithPackageTransform {
    param(
        [string]$SourceFile,
        [string]$DestFile,
        [string]$OldPackage,
        [string]$NewPackage
    )
    
    if (Test-Path $SourceFile) {
        $content = Get-Content $SourceFile -Raw
        $content = $content -replace [regex]::Escape($OldPackage), $NewPackage
        Set-Content -Path $DestFile -Value $content -Encoding UTF8
        return $true
    }
    return $false
}

# Copy shared resources (entities, enums, repos, DTOs)
Write-Host "Copying shared library files..."

# Entities
Get-ChildItem "$backendDir\entity\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\entity\$($_.Name)" `
        -OldPackage "package com.ecommerce.entity" -NewPackage "package com.naturessence.shared.entity"
}

# Enums
Get-ChildItem "$backendDir\enums\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\enums\$($_.Name)" `
        -OldPackage "package com.ecommerce.enums" -NewPackage "package com.naturessence.shared.enums"
}

# Repositories
Get-ChildItem "$backendDir\repository\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\repository\$($_.Name)" `
        -OldPackage "package com.ecommerce.repository" -NewPackage "package com.naturessence.shared.repository"
}

# Also update imports in repository files
Get-ChildItem "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\repository\*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.entity", "import com.naturessence.shared.entity"
    $content = $content -replace "import com\.ecommerce\.enums", "import com.naturessence.shared.enums"
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

# DTOs - Request
Get-ChildItem "$backendDir\dto\request\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\dto\request\$($_.Name)" `
        -OldPackage "package com.ecommerce.dto.request" -NewPackage "package com.naturessence.shared.dto.request"
}

# DTOs - Response
Get-ChildItem "$backendDir\dto\response\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\dto\response\$($_.Name)" `
        -OldPackage "package com.ecommerce.dto.response" -NewPackage "package com.naturessence.shared.dto.response"
}

# Update imports in DTOs
Get-ChildItem "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\dto\request\*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.", "import com.naturessence.shared."
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

Get-ChildItem "$microservicesDir\shared-lib\src\main\java\com\naturessence\shared\dto\response\*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.", "import com.naturessence.shared."
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

Write-Host "✓ Shared library files copied"

# Copy auth-service files (security, config, auth/profile/user controllers and services)
Write-Host "Copying auth-service files..."

# Security files
Get-ChildItem "$backendDir\security\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\security\$($_.Name)" `
        -OldPackage "package com.ecommerce.security" -NewPackage "package com.naturessence.auth.security"
}

# Config files - update all
Get-ChildItem "$backendDir\config\*.java" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\config\$($_.Name)" `
        -OldPackage "package com.ecommerce.config" -NewPackage "package com.naturessence.auth.config"
}

# Auth, Profile, User Services
@("AuthService", "UserService", "RoleService", "RefreshTokenService", "SegmentService", "LoyaltyService") | ForEach-Object {
    $sourceFile = "$backendDir\service\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\service\$_.java" `
            -OldPackage "package com.ecommerce.service" -NewPackage "package com.naturessence.auth.service"
    }
}

# Auth Controllers
@("AuthController", "ProfileController", "AdminUserController", "AdminRoleController", "AdminSegmentController", "AdminLoyaltyController") | ForEach-Object {
    $sourceFile = "$backendDir\controller\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\controller\$_.java" `
            -OldPackage "package com.ecommerce.controller" -NewPackage "package com.naturessence.auth.controller"
    }
}

# Exception handler
$sourceFile = "$backendDir\exception\GlobalExceptionHandler.java"
if (Test-Path $sourceFile) {
    Copy-WithPackageTransform -SourceFile $sourceFile `
        -DestFile "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\exception\GlobalExceptionHandler.java" `
        -OldPackage "package com.ecommerce.exception" -NewPackage "package com.naturessence.auth.exception"
}

# Update imports in auth-service
Get-ChildItem "$microservicesDir\auth-service\src\main\java\com\naturessence\auth\**\*.java" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.", "import com.naturessence.auth."
    $content = $content -replace "import com\.naturessence\.auth\.dto", "import com.naturessence.shared.dto"
    $content = $content -replace "import com\.naturessence\.auth\.entity", "import com.naturessence.shared.entity"
    $content = $content -replace "import com\.naturessence\.auth\.enums", "import com.naturessence.shared.enums"
    $content = $content -replace "import com\.naturessence\.auth\.repository", "import com.naturessence.shared.repository"
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

Write-Host "✓ Auth service files copied"

# Copy catalog-service files
Write-Host "Copying catalog-service files..."

@("ProductService", "CategoryService", "CollectionService", "ReviewService") | ForEach-Object {
    $sourceFile = "$backendDir\service\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\service\$_.java" `
            -OldPackage "package com.ecommerce.service" -NewPackage "package com.naturessence.catalog.service"
    }
}

@("PublicProductController", "PublicCategoryController", "PublicCollectionController", "PublicReviewController", "AdminProductController", "AdminCategoryController", "AdminCollectionController", "AdminReviewController", "FileUploadController") | ForEach-Object {
    $sourceFile = "$backendDir\controller\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\controller\$_.java" `
            -OldPackage "package com.ecommerce.controller" -NewPackage "package com.naturessence.catalog.controller"
    }
}

# Catalog exception
Copy-WithPackageTransform -SourceFile "$backendDir\exception\GlobalExceptionHandler.java" `
    -DestFile "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\exception\GlobalExceptionHandler.java" `
    -OldPackage "package com.ecommerce.exception" -NewPackage "package com.naturessence.catalog.exception"

# Copy security and config for catalog
Get-ChildItem "$backendDir\security\*.java" | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\security\$($_.Name)" `
        -OldPackage "package com.ecommerce.security" -NewPackage "package com.naturessence.catalog.security"
}

Get-ChildItem "$backendDir\config\*.java" | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\config\$($_.Name)" `
        -OldPackage "package com.ecommerce.config" -NewPackage "package com.naturessence.catalog.config"
}

# Update imports in catalog-service
Get-ChildItem "$microservicesDir\catalog-service\src\main\java\com\naturessence\catalog\**\*.java" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.", "import com.naturessence.catalog."
    $content = $content -replace "import com\.naturessence\.catalog\.dto", "import com.naturessence.shared.dto"
    $content = $content -replace "import com\.naturessence\.catalog\.entity", "import com.naturessence.shared.entity"
    $content = $content -replace "import com\.naturessence\.catalog\.enums", "import com.naturessence.shared.enums"
    $content = $content -replace "import com\.naturessence\.catalog\.repository", "import com.naturessence.shared.repository"
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

Write-Host "✓ Catalog service files copied"

# Copy order-service files
Write-Host "Copying order-service files..."

@("OrderService", "CouponService", "ReturnService", "TvaShippingService", "DashboardService", "StripeService") | ForEach-Object {
    $sourceFile = "$backendDir\service\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\order-service\src\main\java\com\naturessence\order\service\$_.java" `
            -OldPackage "package com.ecommerce.service" -NewPackage "package com.naturessence.order.service"
    }
}

@("PublicCheckoutController", "PublicCouponController", "PublicReturnPolicyController", "StripeController", "AdminOrderController", "AdminReturnController", "AdminDashboardController", "AdminTvaShippingController", "AdminPromotionController") | ForEach-Object {
    $sourceFile = "$backendDir\controller\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\order-service\src\main\java\com\naturessence\order\controller\$_.java" `
            -OldPackage "package com.ecommerce.controller" -NewPackage "package com.naturessence.order.controller"
    }
}

# Order exception
Copy-WithPackageTransform -SourceFile "$backendDir\exception\GlobalExceptionHandler.java" `
    -DestFile "$microservicesDir\order-service\src\main\java\com\naturessence\order\exception\GlobalExceptionHandler.java" `
    -OldPackage "package com.ecommerce.exception" -NewPackage "package com.naturessence.order.exception"

# Copy security and config for order
Get-ChildItem "$backendDir\security\*.java" | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\order-service\src\main\java\com\naturessence\order\security\$($_.Name)" `
        -OldPackage "package com.ecommerce.security" -NewPackage "package com.naturessence.order.security"
}

Get-ChildItem "$backendDir\config\*.java" | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\order-service\src\main\java\com\naturessence\order\config\$($_.Name)" `
        -OldPackage "package com.ecommerce.config" -NewPackage "package com.naturessence.order.config"
}

# Update imports in order-service
Get-ChildItem "$microservicesDir\order-service\src\main\java\com\naturessence\order\**\*.java" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.", "import com.naturessence.order."
    $content = $content -replace "import com\.naturessence\.order\.dto", "import com.naturessence.shared.dto"
    $content = $content -replace "import com\.naturessence\.order\.entity", "import com.naturessence.shared.entity"
    $content = $content -replace "import com\.naturessence\.order\.enums", "import com.naturessence.shared.enums"
    $content = $content -replace "import com\.naturessence\.order\.repository", "import com.naturessence.shared.repository"
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

Write-Host "✓ Order service files copied"

# Copy marketing-service files
Write-Host "Copying marketing-service files..."

@("BannerService", "AppearanceService", "EmailService") | ForEach-Object {
    $sourceFile = "$backendDir\service\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\service\$_.java" `
            -OldPackage "package com.ecommerce.service" -NewPackage "package com.naturessence.marketing.service"
    }
}

@("PublicBannerController", "PublicAppearanceController", "AdminBannerController", "AdminAppearanceController", "AdminEmailController") | ForEach-Object {
    $sourceFile = "$backendDir\controller\$_.java"
    if (Test-Path $sourceFile) {
        Copy-WithPackageTransform -SourceFile $sourceFile `
            -DestFile "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\controller\$_.java" `
            -OldPackage "package com.ecommerce.controller" -NewPackage "package com.naturessence.marketing.controller"
    }
}

# Marketing exception
Copy-WithPackageTransform -SourceFile "$backendDir\exception\GlobalExceptionHandler.java" `
    -DestFile "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\exception\GlobalExceptionHandler.java" `
    -OldPackage "package com.ecommerce.exception" -NewPackage "package com.naturessence.marketing.exception"

# Copy security and config for marketing
Get-ChildItem "$backendDir\security\*.java" | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\security\$($_.Name)" `
        -OldPackage "package com.ecommerce.security" -NewPackage "package com.naturessence.marketing.security"
}

Get-ChildItem "$backendDir\config\*.java" | ForEach-Object {
    Copy-WithPackageTransform -SourceFile $_.FullName `
        -DestFile "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\config\$($_.Name)" `
        -OldPackage "package com.ecommerce.config" -NewPackage "package com.naturessence.marketing.config"
}

# Update imports in marketing-service
Get-ChildItem "$microservicesDir\marketing-service\src\main\java\com\naturessence\marketing\**\*.java" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import com\.ecommerce\.", "import com.naturessence.marketing."
    $content = $content -replace "import com\.naturessence\.marketing\.dto", "import com.naturessence.shared.dto"
    $content = $content -replace "import com\.naturessence\.marketing\.entity", "import com.naturessence.shared.entity"
    $content = $content -replace "import com\.naturessence\.marketing\.enums", "import com.naturessence.shared.enums"
    $content = $content -replace "import com\.naturessence\.marketing\.repository", "import com.naturessence.shared.repository"
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

Write-Host "✓ Marketing service files copied"

Write-Host "`n✅ Migration complete! All files have been copied and package names updated."
Write-Host "`nNext steps:"
Write-Host "1. Create application.properties files for each service"
Write-Host "2. Create Main application classes for each service"
Write-Host "3. Run: mvn clean install -DskipTests"
Write-Host "4. Then: mvn spring-boot:run -pl auth-service"
