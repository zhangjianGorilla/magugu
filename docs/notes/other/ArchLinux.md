---
title: ArchLinux
tags: 
  - Linux
createTime: 2024/10/10 09:50:20
permalink: /other/
---

Arch Linux 官网：[https://archlinux.org](https://archlinux.org)

## 镜像下载

> 对下载的镜像进行MD5校验

`md5sum archlinux-202x.0x.01-x86_64.iso`

> passwd    修改密码

> iwctl          联网

`device list` 查看网卡

`station wlan0 scan` 扫描

`station wlan0 get-networks` 列出所有网络

`station wlan0 connect 网络名`

测试 ping www.archlinux.org

> systemctl stop reflector.service    禁用 reflector

> ls /sys/firmware/efi/efivars/          验证启动模式

> timedatectl set-ntp true                 同步时间    不然后面没法下载东西

> lsblk                                                   查看磁盘设备

> gdisk /dev/sda                                 清盘

```shell
root@archiso ~ # timedatectl set-ntp true
root@archiso ~ # lsblk
NAME  MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0   7:0    0 662.7M  1 loop /run/archiso/airootfs
sda     8:0    0    64G  0 disk 
sr0    11:0    1 832.3M  0 rom  /run/archiso/bootmnt
root@archiso ~ # gdisk /dev/sda
GPT fdisk (gdisk) version 1.0.8

Partition table scan:
  MBR: not present
  BSD: not present
  APM: not present
  GPT: not present

Creating new GPT entries in memory.

Command (? for help): x

Expert command (? for help): z
About to wipe out GPT on /dev/sda. Proceed? (Y/N): y
GPT data structures destroyed! You may now partition the disk using fdisk or
other utilities.
Blank out MBR? (Y/N): y
```

> cgdisk /dev/sda             磁盘分区

new   ->   回车  ->   1G    ->     ef00    ->    boot

new         回车         8G             8200          swap

new         回车         20              8300          root

new         回车         35               8300         home

write  ->   yes   ->   quit

```shell
root@archiso ~ # cgdisk /dev/sda
Type search string, or <Enter> to show all codes: efi
ef00 EFI system partition                

Press the <Enter> key to continue: 
root@archiso ~ # lsblk
NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0 662.7M  1 loop /run/archiso/airootfs
sda      8:0    0    64G  0 disk 
├─sda1   8:1    0     1G  0 part 
├─sda2   8:2    0     8G  0 part 
├─sda3   8:3    0    20G  0 part 
└─sda4   8:4    0    35G  0 part 
sr0     11:0    1 832.3M  0 rom  /run/archiso/bootmnt
root@archiso ~ # 
```

> 创建文件系统  格式化分区

- 启动分区,  `mkfs.fat -F32 /dev/sda1`
- 交换分区，`mkswap /dev/sda2`   启用swap分区：`swapon /dev/sda2`
- 系统分区，`mkfs.ext4 /dev/sda3`
- 用户分区，`mkfs.ext4 /dev/sda4`

> 挂载分区

- 挂载系统分区    `mount /dev/sda3 /mnt`

- 挂载启动分区    `mkdir /mnt/boot`   `mount /dev/sda1 /mnt/boot`
- 挂载用户分区    `mkdir /mnt/home`   `mount /dev/sda4 /mnt/home`

```shell
root@archiso ~ # mount /dev/sda3 /mnt
root@archiso ~ # mkdir /mnt/boot
root@archiso ~ # mount /dev/sda1 /mnt/boot
root@archiso ~ # mkdir /mnt/home
root@archiso ~ # mount /dev/sda4 /mnt/home
root@archiso ~ # lsblk
NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0 662.7M  1 loop /run/archiso/airootfs
sda      8:0    0    64G  0 disk 
├─sda1   8:1    0     1G  0 part /mnt/boot
├─sda2   8:2    0     8G  0 part [SWAP]
├─sda3   8:3    0    20G  0 part /mnt
└─sda4   8:4    0    35G  0 part /mnt/home
sr0     11:0    1 832.3M  0 rom  /run/archiso/bootmnt
```

> 设置pacman服务器

```shell
直接切换为中国的软件包
curl -L -o /etc/pacman.d/mirrorlist "https://archlinux.org/mirrorlist/?country=CN"
然后编辑/etc/pacman.d/mirrorlist，反注释其中一个或多个链接。

root@archiso ~ # nano /etc/pacman.d/mirrorlist 
# 同步
root@archiso ~ # pacman -Sy               
:: Synchronizing package databases...
 core                                   136.1 KiB  69.2 KiB/s 00:02 [#####################################] 100%
 extra                                 1586.3 KiB  1164 KiB/s 00:01 [#####################################] 100%
 community                                5.8 MiB  3.18 MiB/s 00:02 [#####################################] 100
# 备份
root@archiso ~ # cp /etc/pacman.d/mirrorlist /etc/pacman.d/mirrorlist.backup    
root@archiso ~ # reflector --verbose --latest 15 --sort rate --save /etc/pacman.d/mirrorlist




Server = http://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch
Server = http://mirrors.163.com/archlinux/$repo/os/$arch
Server = http://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch
Server = http://mirrors.zju.edu.cn/archlinux/$repo/os/$arch
Server = http://mirrors.cqu.edu.cn/archlinux/$repo/os/$arch
Server = http://mirrors.lzu.edu.cn/archlinux/$repo/os/$arch
Server = http://mirrors.neusoft.edu.cn/archlinux/$repo/os/$arch
```

> 安装基本系统及固件

```shell
root@archiso ~ # pacstrap -i /mnt linux linux-headers linux-firmware base base-devel vim nano intel-ucode
root@archiso ~ # genfstab -U /mnt >> /mnt/etc/fstab
```

> 进入系统

`arch-chroot /mnt`

```shell
[root@archiso /]# pacman -Syy
:: Synchronizing package databases...
 core                                   136.1 KiB   560 KiB/s 00:00 [######################################] 100%
 extra                                 1586.3 KiB  6.65 MiB/s 00:00 [######################################] 100%
 community                                5.8 MiB  33.1 MiB/s 00:00 [######################################] 100%
```

> 配置系统时区

```shell
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
hwclock --systohc
```

> 本地化/语言配置

```shell
vim /etc/locale.gen
[root@archiso /]# locale-gen
Generating locales...
  en_US.UTF-8... done
  zh_CN.UTF-8... done
Generation complete.
[root@archiso /]# echo LANG=en_US.UTF-8 > /etc/locale.conf
[root@archiso /]# nano /etc/locale.conf
[root@archiso /]# nano /etc/locale.conf
[root@archiso /]# export LANG=en_US.UTF-8
```

> 网络配置

- 修改hostname文件   `nano /etc/hostname`

```shell
DELL
```

- 修改hosts文件   `nano /etc/hosts`

```shell
127.0.0.1	localhost
::1		localhost
127.0.1.1	DELL.localdomain	DELL # 主机名.本地域名 主机名
```

> 添加用户

```shell
# 添加用户
useradd -m -g users -G wheel,storage,power -s /bin/bash username
# 修改用户密码
passwd username
# 修改root用户密码
passwd root
```

> 添加用户权限

```shell
EDITOR=nano visudo

去掉 #%wheel ALL=(ALL) ALL 前面的#号

# 在最后一行添加默认管理员密码
Defaults rootpw
```

> 安装grub

```shell
# 下载grub安装需要的文件
pacman -S grub efibootmgr intel-ucode os-prober
# 查看系统架构
uname -m     // x86_64
# 安装grub
grub-install --target=x86_64-efi --efi-directory=/boot
# 生成主配置文件
grub-mkconfig -o /boot/grub/grub.cfg
```



> 安装和配置Systemd启动器

```shell
# 安装
bootctl install
# 配置
# nano /boot/loader/entries/arch.conf
title My Arch Linux
linux /vmlinuz-linux   # 长期自持内核(vm linuz-linux-lts)
initrd /intel-ucode.img
initrd /initramfs-linux.img
# echo "optinos root=PARTUUID=$(blkid -s PARTUUID -o value /dev/sda3) rw" >> /boot/loader/entries/arch.conf
```

> systemctl enable fstrim.timer

> 开启32位应用支持

```shell
# nano /etc/pacman.conf
# 去掉下面两行的前面的 # 号
[multilib]
Include = /etc/pacman.d/mirrorlist
# 添加archlinuxcn源   在最后面加
[archlinuxcn]
SigLevel = TrustAll
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinuxcn/$arch
# 同步一下
pacman -Syy
# 安装archlinux密钥环
pacman -S archlinuxcn-keyring
# 如果报错就按顺序执行下面的操作
pacman -Syu haveged
systemctl start haveged
systemctl enable haveged

rm -fr /etc/pacman.d/gnupg
pacman-key --init
pacman-key --populate archlinux
pacman-key --populate archlinuxcn
```

> 安装网络，声音，蓝牙，文件管理后台

```shell
# 网络
pacman -S networkmanager network-manager-applet dialog wpa_supplicant dhcpcd 
# 启动
systemctl enable NetworkManager
# 蓝牙   文件管理等
pacman -S mtools dosfstools bluez bluez-utils cups xdg-utils xdg-user-dirs alsa-utils pulseaudio pulseaudio-bluetooth reflector openssh
```

> **安装显卡**

```shell
# 执行如下命令查询显卡类型
lspci | grep -e VGA -e 3D
# 查看所有开源驱动
pacman -Ss xf86-video
# 英特尔显卡
pacman -S xf86-video-intel mesa lib32-mesa
pacman -S mesa lib32-mesa vulkan-intel lib32-vulkan-intel
pacman -S mesa lib32-mesa vulkan-intel lib32-vulkan-intel
# AMD 显卡
pacman -S xf86-video-amdgpu lib32-vulkan-radeon libva-mesa-driver lib32-mesa-driver
mesa-vdpau lib32-mesa-vdpau
# Nvidia 显卡
pacman -S nvidia dkms libglvnd lib32-libglvnd nvidia-utils lib32-nvidia-utils opencl-nvidia lib32-opencl-nvidia nvidia-settings
# 双显卡切换
yay -S optimus-manager optimus-manager-qt
# 可以用命令切换显卡
optimus-manager --switch nvidia
optimus-manager --switch integrated
optimus-manager --switch hybrid
# 也可以用 optimus-manager-qt 提供的图形界面切换
```

> **Pacman钩子** 为了避免更新 NVIDIA 驱动之后忘了更新initramfs

```shell
# nano /etc/mkinitcpio.conf
# 在MODULES=() 中按顺序添加
MODULES=(nvidia nvidia_modeset nvidia_uvm nvidia_drm)

mkdir /etc/pacman.d/hooks
nano /etc/pacman.d/hooks/nvidia.hook
[Trigger]
Operation=Install
Operation=Upgrade
Operation=Remove
Type=Package
Target=nvidia
Target=linux

[Action]
Depends=mkinitcpio
When=PostTransaction
Exec=/usr/bin/mkinitcpio -P
```

回去改启动器

``` shell
# systemd启动器
# nano /boot/loader/entries/arch.conf
# 在 options 的rw后面接上 nvidia-drm.modeset=1
options        root=PARTUUID=14420948-2cea-4de7-b042-40f67c618660 rw nvidia-drm.modeset=1
# grub启动器
nano /etc/default/grub
# 在GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet"后面加上nvidia-drm.modeset=1
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet nvidia-drm.modeset=1"
# 重新生成配置文件
grub-mkconfig -o /boot/grub/grub.cfg
```

> 安装xorg窗口系统

```shell
pacman -S xorg-server xorg-apps xorg-xinit xorg-twm xorg-xclock xterm
```

测试  `startx`

> 安装KDE桌面

```shell
pacman -S sddm plasma
systemctl enable sddm
```

> 最后exit   -> umount -R /mnt  ->reboot



```shell
# 安装英文和中文字体
sudo pacman -S ttf-dejavu wqy-microhei
# 系统配置中文
系统设置 -> Regional Settings -> Language -> add languages -> 简体中文 -> 置顶
# 安装中文输入法
sudo pacman -S fcitx fcitx-im kcm-fcitx fcitx-googlepinyin
# 配置fcitx环境变量
sudo nano .pam_environment
# fcitx
GTK_IM_MODULE DEFAULT=fcitx
QT_IM_MODULE  DEFAULT=fcitx
XMODIFIERS    DEFAULT=\@im=fcitx
# 安装文件管理器 文本/代码编辑器 下拉命令行 分区管理器 k易连 
sudo pacman -S dolphin kate yakuake partitionmanager kdeconnect 
# 安装zsh
sudo pacman -S zsh zsh-completions
# 将zsh设为默认shell
sudo chsh -s /bin/zsh zhangjian(用户名)
# 下载oh my zsh
sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# 设置主题
nano .zshrc
ZSH_THEME="crcandy"
```

> java，maven环境

```java
# JDK1.8
JAVA_HOME=/opt/jdk1.8.0_301
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

# Maven
MAVEN_HOME=/usr/local/apache-maven-3.8.2
export MAVEN_HOME
export PATH=${PATH}:${MAVEN_HOME}/bin
```



### pacman命令

- 安装指定包`pacman -S 包名`   --needed会覆盖之前安装的包依赖

- 删除软件包

    - 删除单个软件包，并保留其全部已安装的依赖关系 `pacman -R 包名`
    - 删除指定软件包，及其所有没有被其他已安装软件包使用的依赖关系 `pacman -Rs 包名`
    - 删除软件包和所有依赖这个软件包的程序 `pacman -Rsc 包名`
    - 删除一个被其他软件包依赖的软件包，但是不删除依赖这个软件包的其他软件包 `pacman -Rdd 包名`
    - 删除某些程序是会备份重要配置文件，在其后面加上*.pacsave扩展名。-n选项可以避免备份这些文件 `pacman -Rn 包名`

- 升级包 `pacman -Syu`

- 查询包数据库

    - 在包数据库中查询软件包，查询位置包含了软件包的名字和描述`pacman -Ss string1 string2 ...`
    - 查询已安装的软件包  `pacman -Qs string1 string2 ...`
    - 按文件名查找软件库  `pacman -F string1 string2 ...`
    - 显示软件包的详尽的信息  `pacman -Si package_name`
    - 查询本地安装包的详细信息  `pacman -Qi package_name`
    - 使用两个 `-i` 将同时显示备份文件和修改状态  `pacman -Qii package_name`
    - 要获取已安装软件包所包含文件的列表  `pacman -Ql package_name`
    - 查询远程库中软件包包含的文件  `pacman -Fl package_name`
    - 检查软件包安装的文件是否都存在  `pacman -Qk package_name`
    - 两个参数`k`将会执行一次更彻底的检查。 查询数据库获取某个文件属于哪个软件包  `pacman -Qo /path/to/file_name`
    - 查询文件属于远程数据库中的哪个软件包  `pacman -F /path/to/file_name`
    - 罗列所有不再作为依赖的软件包(孤立orphans)  `pacman -Qdt`
    - 要罗列所有明确安装而且不被其它包依赖的软件包  `pacman -Qet`
    - 要显示软件包的依赖树  `pactree package_name`

- 其他命令

    - 升级系统时安装其他软件包  `pacman -Syu package_name1 package_name2 ...`

    - 下载包而不安装它  `pacman -Sw package_name`

    - 安装一个**本地**包(不从源里下载）  `pacman -U /path/to/package/package_name-version.pkg.tar.xz`

    - 要将本地包保存至缓存，可执行  `pacman -U file:///path/to/package/package_name-version.pkg.tar.xz`

    - 安装一个**远程**包（不在 *pacman* 配置的源里面）  `pacman -U http://www.example.com/repo/example.pkg.tar.xz`



### Xorg

https://wiki.archlinux.org/title/Xorg_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)