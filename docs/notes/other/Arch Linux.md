---
title: Arch Linux
createTime: 2024/10/10 09:50:20
permalink: /other/bfw6yljm/
tags:
  - Linux 
  - Nvidia 
  - Hyprland
---

==Arch Linux== 是一种通用操作系统，它是基于 x86-64 架构的一类 GNU/Linux 发行版。

Arch Linux 采用滚动升级模式，尽全力为用户提供最新的稳定版软件。初始安装完成的 Arch Linux 只是一个基本系统，随后用户可以根据自己的喜好安装需要的软件并配置成符合自己理想的个性化系统。

::: details 为什么使用 Arch Linux ？
- 可以第一时间体验新软件
- 软件安装简单 `pacman -S xxxx`
- 社区强大，[文档](https://wiki.archlinuxcn.org/wiki/%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)完善，提供用户仓库AUR
- 可以高度自由的定制自己的系统
:::

## 安装准备

::: note 
可以手动安装和用官方提供的安装脚本 `archinstall`。推荐手动安装，手动安装可以了解一些系统底层的东西，之后系统出现问题也不至于束手无策。
:::

### 下载 ISO 镜像文件

[下载地址](https://archlinux.org/download/)
同时在下载页面下载 `PGP signature` 签名文件，将 iso 和签名文件放在一个文件夹下进行签名验证。保证下载的镜像文件是没有被篡改的。

```bash
gpg --keyserver-options auto-key-retrieve --verify archlinux-202x.0x.01-x86_64.iso.sig
```

### 制作启动盘

推荐使用 [ventoy](https://www.ventoy.net/cn/doc_start.html) [Rufus](https://rufus.ie/zh/) 或 [etcher](https://github.com/balena-io/etcher) 进行刻录。

### BIOS 设置

开机进入 BIOS (系统图标出现按 `F2`/`F8`/`F10`/`DEL`) 设置界面
- 将 Secure Boot 关闭 Disable
- 设置启动模式为 UEFI
- 调整硬盘启动顺序

## 开始安装

### 禁用 reflector

reflector 会选择速度合适的镜像源，但是结果不一定准确，同时还会清空配置文件
```bash
systemctl stop reflector.service
```

### 确认是否为 UEFI 模式

```bach
 ls /sys/firmware/efi/efivars
```
如果输出一堆东西，说明就是 UEFI 模式。

### 连接到互联网

有线连接直接插入网线即可。
无线连接步骤如下：
```bash
# 确保网络接口打开
ip link                                         # 列出网络接口信息
ip link set wlan0 up                            # 如果 wlan0 网卡没有启动，执行此命令启动
rfkill unblock wifi                             # 如果启动网卡报类似 `Operation not possible due to RF-kill` 错误，执行此命令

# 连接无线网络
iwctl                                           # 进入交互式命令行
device list                                     # 列出网卡 比如无线网卡叫 wlan0  
station wlan0 scan                              # 扫描网络
station wlan0 get-networks                      # 列出网络
station wlan0 connect wifi password             # 连接网络
exit                                            # 退出
```
测试网络是否连接成功
```bash
ping www.baidu.com
```

### 更新系统时间

```bash
timedatectl set-ntp true    #将系统时间与网络时间进行同步
timedatectl status          #检查服务状态
```

### 创建磁盘分区

| 方案        |      分区      |  分区类型 | 大小 |
| ------------- | :-----------: | ----: | ----: |
| EFI 分区      | /efi | EFI System | 1G |
| 根目录      |   /    |   Linux filesystem | 200G |
| 用户主目录 |   /home    |    Linux filesystem | 500G |

::: warning
根目录大小建议不小于 50G，日常使用 100G也够了，如果空间充足可以多给。
:::

``` bash
# 将磁盘转换成 `gpt` 类型
lsblk                           #显示分区情况 找到你想安装的磁盘名称
parted /dev/sda                 #执行parted，进入交互式命令行，进行磁盘类型变更
(parted)mktable                 #输入mktable
New disk label type? gpt        #输入gpt 将磁盘类型转换为gpt 如磁盘有数据会警告，输入yes即可
quit                            #最后quit退出parted命令行交互
```

使用 `cfdisk` 命令进行磁盘分区

```bash
cfdisk /dev/sda                # 分区操作
fdisk -l                       # 查看磁盘情况 
```

::: note 
创建磁盘并分好区后一定要先 `Write` 然后在 `Quite`。
:::

### 格式化分区

需要对各分区用合适的文件系统进行格式化。
```bash
# sdax 中的 x 表示分区的序号，根据分区时设置的来
mkfs.ext4 /dev/sdax           # 格式化根目录 `/` 和 `home` 目录的两个分区
mkfs.vfat /dev/sdax           # 格式化 `efi` 分区
```

### 挂载分区

```bash
mount /dev/sdax /mnt
mkdir /mnt/efi
mount /dev/sdax /mnt/efi
mkdir /mnt/home
mount /dev/sdax mnt/home
```
::: note 
先挂载根分区，再挂载 EFI 分区
:::

### 配置镜像源

```bash
```

### 安装系统

```bash
# 必须的基础包
pacstrap /mnt base base-devel linux linux-headers linux-firmware

# 功能性软件
pacstrap /mnt dhcpcd iwd vim bash-completion
```

### 生成 fstab 文件

```bash
genfstab -U /mnt >> /mnt/etc/fstab

cat /mnt/etc/fstab  # 检查有没有错
```

### chroot 到新安装的系统

```bash
arch-chroot /mnt
```

### 设置时区

```bash
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 将正确的 UTC 时间写入硬件时间
hwclock --systohc
```

### 区域和本地化设置

编辑 `/etc/locale.gen` 文件，将 `en_US.UTF-8` 和 `zh_CN.UTF-8` 行的注释(#)去掉
```bash
# 编辑 locale.gen 文件
vim /etc/locale.gen

# 生成 locale 信息
locale-gen

# 设定 LANG 变量
echo 'LANG=en_US.UTF-8' > /etc/locale.conf
```

### 网络配置

```bash
# 设置主机名
vim /etc/hostname
Arch

vim /etc/hosts
127.0.0.1   localhost
::1         localhost
127.0.1.1   Arch
```

### 为 `root` 用户设置密码

```bash
passwd root
```

### 安装微码

```bash
pacman -S intel-ucode   #Intel
pacman -S amd-ucode     #AMD
```

### 安装引导程序

```bash
pacman -S grub efibootmgr   #grub是启动引导器，efibootmgr被 grub 脚本用来将启动项写入 NVRAM。
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
vim /etc/default/grub
# 去掉 `GRUB_CMDLINE_LINUX_DEFAULT` 一行中最后的 `quiet` 参数；
# 把 `loglevel` 从 3 改成 5（可选，以便后续如果出现系统错误，方便排错）；
# 在最后加上 `nowatchdog` 提升开机速度
```
::: note
使用 Nvidia 需要在 `GRUB_CMDLINE_LINUX_DEFAULT` 或 `GRUB_CMDLINE_LINUX` 加入参数 `nvidia_drm.modeset=1`
:::

生成 GRUB 配置文件
```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

### 基础安装完成，重启
```bash
exit              # 退出 chroot 环境
umount -R /mnt    # 手动卸载被挂载的分区
reboot            # 重启
```

## 推荐网站
[ArchWiki](https://wiki.archlinuxcn.org/wiki/%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)
[大佬的网站](https://archlinuxstudio.github.io/ArchLinuxTutorial/#/)
